/**
 * PlcService — wraps node-snap7 with:
 *   - connect / disconnect
 *   - cyclic read every POLL_MS (default 500 ms)
 *   - auto-reconnect on failure
 *   - write helpers for memory bits (M0.0, M0.1, M0.2) and output bits (Q0.0)
 *   - reads the full tag catalog (TAGS) and exposes them in snapshot.tags
 *
 * Hardware command mapping:
 *   Forward / Reverse → Q0.0 ON   (+ M0.0 / M0.1 mirror)
 *   Stop              → Q0.0 OFF  (+ M0.2 mirror)
 */

const snap7 = require("node-snap7");
const { TAGS, parseAddress } = require("./tagCatalog");

const BIT = (byte, bit) => (byte & (1 << bit)) !== 0;
const SET_BIT = (byte, bit, on) =>
  on ? byte | (1 << bit) : byte & ~(1 << bit);

// Byte ranges to read for each area, large enough to cover all tags.
const READ_PLAN = {
  I:  [{ start: 0, len: 2 }],            // IB0..IB1
  Q:  [{ start: 0, len: 2 }],            // QB0..QB1
  M:  [{ start: 0, len: 20 },            // MB0..MB19  (M0.x, M2.x, M10.x, MW12..MW18)
       { start: 100, len: 2 }],          // MW100
  DB3:[{ start: 0, len: 20 }],           // DBW0..DBW18
  DB4:[{ start: 0, len: 40 }],           // DBD0..DBD36
};

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

    // Raw buffers per area (Buffer or null)
    this.buffers = { I: null, Q: null, M0: null, M100: null, DB3: null, DB4: null, DB11: null };

    this.state = {
      inputs: {
        startForward: false, stop: false, openLimit: false,
        closeLimit: false,   startReverse: false,
      },
      outputs: { forward: false, reverse: false },
      memory:  { forwardCmd: false, reverseCmd: false, stopCmd: false },
      tags: {},
      timestamp: Date.now(),
    };
  }

  configure({ ip, rack, slot }) {
    if (ip) this.ip = ip;
    if (rack !== undefined) this.rack = rack;
    if (slot !== undefined) this.slot = slot;
  }

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
      this.connect().catch(() => {});
    }, 3000);
  }

  startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => this.pollOnce(), this.pollMs);
  }

  // Promise wrapper around ReadArea
  readArea(area, dbNum, start, len) {
    return new Promise((resolve, reject) => {
      this.client.ReadArea(area, dbNum, start, len, this.client.S7WLByte, (err, buf) => {
        if (err) return reject(new Error(this.client.ErrorText(err)));
        resolve(buf);
      });
    });
  }

  async pollOnce() {
    if (!this.connected) return;
    try {
      const plan = [
        () => this.readArea(this.client.S7AreaPE, 0, READ_PLAN.I[0].start, READ_PLAN.I[0].len),
        () => this.readArea(this.client.S7AreaPA, 0, READ_PLAN.Q[0].start, READ_PLAN.Q[0].len),
        () => this.readArea(this.client.S7AreaMK, 0, READ_PLAN.M[0].start, READ_PLAN.M[0].len),
        () => this.readArea(this.client.S7AreaMK, 0, READ_PLAN.M[1].start, READ_PLAN.M[1].len),
        () => this.readArea(this.client.S7AreaDB, 3, READ_PLAN.DB3[0].start, READ_PLAN.DB3[0].len),
        () => this.readArea(this.client.S7AreaDB, 4, READ_PLAN.DB4[0].start, READ_PLAN.DB4[0].len),
      ];
      const settled = await Promise.allSettled(plan.map((fn) => fn()));
      // A single area that can't be read (e.g. a DB that doesn't exist on this
      // PLC) must NOT tear down the whole connection. Only a total failure —
      // every read rejected — counts as a real connection loss.
      if (settled.every((r) => r.status === "rejected")) {
        return this.handleIoError(settled[0].reason || new Error("all reads failed"));
      }
      const val = (i) => (settled[i].status === "fulfilled" ? settled[i].value : null);
      const ib = val(0), qb = val(1), mb0 = val(2), mb100 = val(3), db3 = val(4), db4 = val(5);
      this.buffers = { I: ib, Q: qb, M0: mb0, M100: mb100, DB3: db3, DB4: db4, DB11: null };

      // Legacy fixed fields (kept for the existing UI panels) — guard nulls
      if (ib && qb && mb0) {
        const ib0 = ib[0], qb0 = qb[0], mb = mb0[0];
        this.state.inputs = {
          startForward: BIT(ib0, 0), stop: BIT(ib0, 1), openLimit: BIT(ib0, 2),
          closeLimit: BIT(ib0, 3), startReverse: BIT(ib0, 4),
        };
        this.state.outputs = { forward: BIT(qb0, 0), reverse: BIT(qb0, 1) };
        this.state.memory  = { forwardCmd: BIT(mb, 0), reverseCmd: BIT(mb, 1), stopCmd: BIT(mb, 2) };
      }

      // Decode every tag from the catalog
      this.state.tags = this.decodeTags();
      this.state.timestamp = Date.now();
    } catch (e) {
      this.handleIoError(e);
    }
  }

  // Pick the right buffer + offset for a parsed address.
  bufferFor(p) {
    if (p.area === "I") return { buf: this.buffers.I, off: p.byte };
    if (p.area === "Q") return { buf: this.buffers.Q, off: p.byte };
    if (p.area === "M") {
      if (p.byte >= 100) return { buf: this.buffers.M100, off: p.byte - 100 };
      return { buf: this.buffers.M0, off: p.byte };
    }
    if (p.area === "DB" && p.db === 3) return { buf: this.buffers.DB3, off: p.byte };
    if (p.area === "DB" && p.db === 4) return { buf: this.buffers.DB4, off: p.byte };
    if (p.area === "DB" && p.db === 11) return { buf: this.buffers.DB11, off: p.byte };
    return { buf: null, off: 0 };
  }

  decodeTags() {
    const out = {};
    for (const tag of TAGS) {
      try {
        const p = parseAddress(tag.address);
        const { buf, off } = this.bufferFor(p);
        if (!buf) { out[tag.name] = null; continue; }
        if (p.kind === "bit")   out[tag.name] = BIT(buf[off], p.bit);
        else if (p.kind === "word")  out[tag.name] = buf.readInt16BE(off);
        else if (p.kind === "dword") out[tag.name] = buf.readFloatBE(off);
      } catch {
        out[tag.name] = null;
      }
    }
    return out;
  }

  handleIoError(err) {
    this.lastError = err.message || String(err);
    this.logger.warn(`[PLC] I/O error: ${this.lastError}`);
    this.connected = false;
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    try { this.client.Disconnect(); } catch (_) {}
    this.scheduleReconnect();
  }

  writeMemoryBit(bit, value) {
    return new Promise((resolve, reject) => {
      if (!this.connected) return reject(new Error("PLC not connected"));
      this.client.ReadArea(this.client.S7AreaMK, 0, 0, 1, this.client.S7WLByte, (err, buf) => {
        if (err) return reject(new Error(this.client.ErrorText(err)));
        const out = Buffer.from([SET_BIT(buf[0], bit, value)]);
        this.client.WriteArea(this.client.S7AreaMK, 0, 0, 1, this.client.S7WLByte, out, (werr) => {
          if (werr) return reject(new Error(this.client.ErrorText(werr)));
          resolve(true);
        });
      });
    });
  }

  writeOutputBit(bit, value) {
    return new Promise((resolve, reject) => {
      if (!this.connected) return reject(new Error("PLC not connected"));
      this.client.ReadArea(this.client.S7AreaPA, 0, 0, 1, this.client.S7WLByte, (err, buf) => {
        if (err) return reject(new Error(this.client.ErrorText(err)));
        const out = Buffer.from([SET_BIT(buf[0], bit, value)]);
        this.client.WriteArea(this.client.S7AreaPA, 0, 0, 1, this.client.S7WLByte, out, (werr) => {
          if (werr) return reject(new Error(this.client.ErrorText(werr)));
          resolve(true);
        });
      });
    });
  }

  /**
   * Generic write keyed by tag address. Routes by parsed kind:
   *   bit   -> writeBitByAddr (I/Q/M)
   *   word  -> writeWordByAddr (M, DB)  — Int16 BE
   *   dword -> writeDWordByAddr (DB)    — Float32 BE
   */
  writeByAddr(addr, value) {
    const p = parseAddress(addr);
    if (!this.connected) return Promise.reject(new Error("PLC not connected"));
    if (p.kind === "bit") return this.writeBitByAddr(addr, !!value);
    if (p.kind === "word") return this.writeWordByAddr(p, Number(value));
    if (p.kind === "dword") return this.writeDWordByAddr(p, Number(value));
    return Promise.reject(new Error(`writeByAddr: unsupported kind ${p.kind}`));
  }

  writeWordByAddr(p, intValue) {
    let area, dbNum = 0;
    if (p.area === "M") area = this.client.S7AreaMK;
    else if (p.area === "DB") { area = this.client.S7AreaDB; dbNum = p.db; }
    else return Promise.reject(new Error(`writeWordByAddr: unsupported area ${p.area}`));
    const v = Math.max(-32768, Math.min(32767, Math.round(intValue)));
    const buf = Buffer.alloc(2);
    buf.writeInt16BE(v, 0);
    return new Promise((resolve, reject) => {
      this.client.WriteArea(area, dbNum, p.byte, 2, this.client.S7WLByte, buf, (err) => {
        if (err) return reject(new Error(this.client.ErrorText(err)));
        resolve(true);
      });
    });
  }

  writeDWordByAddr(p, floatValue) {
    if (p.area !== "DB") {
      return Promise.reject(new Error(`writeDWordByAddr: unsupported area ${p.area}`));
    }
    const buf = Buffer.alloc(4);
    buf.writeFloatBE(Number(floatValue), 0);
    return new Promise((resolve, reject) => {
      this.client.WriteArea(this.client.S7AreaDB, p.db, p.byte, 4, this.client.S7WLByte, buf, (err) => {
        if (err) return reject(new Error(this.client.ErrorText(err)));
        resolve(true);
      });
    });
  }

  /**
   * Generic single-bit write to any I/Q/M address (e.g. "M0.0", "Q0.2").
   * Used by the /write endpoint to drive force buttons from the UI.
   */
  writeBitByAddr(addr, value) {
    const p = parseAddress(addr);
    if (p.kind !== "bit") {
      return Promise.reject(new Error(`writeBitByAddr: not a bit address: ${addr}`));
    }
    let area;
    if (p.area === "Q") area = this.client.S7AreaPA;
    else if (p.area === "M") area = this.client.S7AreaMK;
    else if (p.area === "I") area = this.client.S7AreaPE;
    else return Promise.reject(new Error(`writeBitByAddr: unsupported area ${p.area}`));

    return new Promise((resolve, reject) => {
      if (!this.connected) return reject(new Error("PLC not connected"));
      this.client.ReadArea(area, 0, p.byte, 1, this.client.S7WLByte, (err, buf) => {
        if (err) return reject(new Error(this.client.ErrorText(err)));
        const out = Buffer.from([SET_BIT(buf[0], p.bit, !!value)]);
        this.client.WriteArea(area, 0, p.byte, 1, this.client.S7WLByte, out, (werr) => {
          if (werr) return reject(new Error(this.client.ErrorText(werr)));
          resolve(true);
        });
      });
    });
  }

  async commandForward() {
    await this.writeOutputBit(0, true);
    await this.writeMemoryBit(1, false);
    await this.writeMemoryBit(2, false);
    await this.writeMemoryBit(0, true);
  }
  async commandReverse() {
    await this.writeOutputBit(0, true);
    await this.writeMemoryBit(0, false);
    await this.writeMemoryBit(2, false);
    await this.writeMemoryBit(1, true);
  }
  async commandStop() {
    await this.writeOutputBit(0, false);
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
      memory:  this.state.memory,
      tags:    this.state.tags,
      lastError: this.lastError || undefined,
      simulated: false,
      timestamp: this.state.timestamp,
    };
  }
}

module.exports = { PlcService, TAGS };
