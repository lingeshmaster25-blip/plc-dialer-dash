/**
 * PlcService — wraps node-snap7 with:
 *   - connect / disconnect
 *   - cyclic read every POLL_MS (default 500 ms)
 *   - auto-reconnect on failure
 *   - write helpers for memory bits (M0.0, M0.1, M0.2)
 *
 * Address map (matches the HMI frontend):
 *   Inputs  (IB0):
 *     I0.0 Start Forward
 *     I0.1 Stop
 *     I0.2 Open Limit Switch
 *     I0.3 Close Limit Switch
 *     I0.4 Start Reverse
 *   Outputs (QB0):
 *     Q0.0 Forward
 *     Q0.1 Reverse
 *   Memory  (MB0):
 *     M0.0 Forward Command
 *     M0.1 Reverse Command
 *     M0.2 Stop Command
 */

const snap7 = require("node-snap7");

const BIT = (byte, bit) => (byte & (1 << bit)) !== 0;
const SET_BIT = (byte, bit, on) =>
  on ? byte | (1 << bit) : byte & ~(1 << bit);

class PlcService {
  constructor({ ip, rack = 0, slot = 1, pollMs = 500, logger = console } = {}) {
    this.client = new snap7.S7Client();
    this.ip = ip;
    this.rack = rack;
    this.slot = slot;
    this.pollMs = pollMs;
    this.logger = logger;

    this.connected = false;
    this.lastError = null;
    this.pollTimer = null;
    this.reconnectTimer = null;

    this.state = {
      inputs: {
        startForward: false,
        stop: false,
        openLimit: false,
        closeLimit: false,
        startReverse: false,
      },
      outputs: { forward: false, reverse: false },
      memory: { forwardCmd: false, reverseCmd: false, stopCmd: false },
      timestamp: Date.now(),
    };
  }

  configure({ ip, rack, slot }) {
    if (ip) this.ip = ip;
    if (rack !== undefined) this.rack = rack;
    if (slot !== undefined) this.slot = slot;
  }

  /** Connect to the PLC. Returns a promise. */
  connect() {
    return new Promise((resolve, reject) => {
      this.logger.log(`[PLC] Connecting to ${this.ip} (rack=${this.rack}, slot=${this.slot})…`);
      this.client.ConnectTo(this.ip, this.rack, this.slot, (err) => {
        if (err) {
          this.connected = false;
          this.lastError = this.client.ErrorText(err);
          this.logger.error(`[PLC] Connect error: ${this.lastError}`);
          this.scheduleReconnect();
          return reject(new Error(this.lastError));
        }
        this.connected = true;
        this.lastError = null;
        this.logger.log(`[PLC] Connected.`);
        this.startPolling();
        resolve(true);
      });
    });
  }

  disconnect() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.pollTimer = null;
    this.reconnectTimer = null;
    try { this.client.Disconnect(); } catch (_) {}
    this.connected = false;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {/* will reschedule */});
    }, 3000);
  }

  startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => this.pollOnce(), this.pollMs);
  }

  /** Read 1 byte from inputs (IB0), outputs (QB0), memory (MB0). */
  pollOnce() {
    if (!this.connected) return;
    // Reads are wrapped in try/catch; on any error we mark disconnected and reconnect.
    this.client.ReadArea(
      this.client.S7AreaPE, 0, 0, 1, this.client.S7WLByte,
      (err, ibuf) => {
        if (err) return this.handleIoError(err, "read I");
        this.client.ReadArea(
          this.client.S7AreaPA, 0, 0, 1, this.client.S7WLByte,
          (err2, qbuf) => {
            if (err2) return this.handleIoError(err2, "read Q");
            this.client.ReadArea(
              this.client.S7AreaMK, 0, 0, 1, this.client.S7WLByte,
              (err3, mbuf) => {
                if (err3) return this.handleIoError(err3, "read M");
                const ib = ibuf[0], qb = qbuf[0], mb = mbuf[0];
                this.state = {
                  inputs: {
                    startForward: BIT(ib, 0),
                    stop:         BIT(ib, 1),
                    openLimit:    BIT(ib, 2),
                    closeLimit:   BIT(ib, 3),
                    startReverse: BIT(ib, 4),
                  },
                  outputs: { forward: BIT(qb, 0), reverse: BIT(qb, 1) },
                  memory:  { forwardCmd: BIT(mb, 0), reverseCmd: BIT(mb, 1), stopCmd: BIT(mb, 2) },
                  timestamp: Date.now(),
                };
              }
            );
          }
        );
      }
    );
  }

  handleIoError(err, op) {
    this.lastError = this.client.ErrorText(err);
    this.logger.warn(`[PLC] I/O error during ${op}: ${this.lastError}`);
    this.connected = false;
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    try { this.client.Disconnect(); } catch (_) {}
    this.scheduleReconnect();
  }

  /** Set/clear a single bit in MB0 atomically (read-modify-write). */
  writeMemoryBit(bit, value) {
    return new Promise((resolve, reject) => {
      if (!this.connected) return reject(new Error("PLC not connected"));
      this.client.ReadArea(
        this.client.S7AreaMK, 0, 0, 1, this.client.S7WLByte,
        (err, buf) => {
          if (err) return reject(new Error(this.client.ErrorText(err)));
          const newByte = SET_BIT(buf[0], bit, value);
          const out = Buffer.from([newByte]);
          this.client.WriteArea(
            this.client.S7AreaMK, 0, 0, 1, this.client.S7WLByte, out,
            (werr) => {
              if (werr) return reject(new Error(this.client.ErrorText(werr)));
              resolve(true);
            }
          );
        }
      );
    });
  }

  /** Forward command: M0.0 = 1, M0.1 = 0, M0.2 = 0 (interlock). */
  async commandForward() {
    await this.writeMemoryBit(1, false); // M0.1
    await this.writeMemoryBit(2, false); // M0.2
    await this.writeMemoryBit(0, true);  // M0.0
  }
  async commandReverse() {
    await this.writeMemoryBit(0, false);
    await this.writeMemoryBit(2, false);
    await this.writeMemoryBit(1, true);
  }
  async commandStop() {
    await this.writeMemoryBit(0, false);
    await this.writeMemoryBit(1, false);
    await this.writeMemoryBit(2, true);
  }

  snapshot() {
    return {
      connected: this.connected,
      ip: this.ip,
      rack: this.rack,
      slot: this.slot,
      inputs: this.state.inputs,
      outputs: this.state.outputs,
      memory: this.state.memory,
      lastError: this.lastError || undefined,
      simulated: false,
      timestamp: this.state.timestamp,
    };
  }
}

module.exports = { PlcService };
