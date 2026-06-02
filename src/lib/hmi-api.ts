// HMI API client. Talks to the Node.js + node-snap7 backend.
// If backend is unreachable (e.g. running in Lovable preview without the local
// server running), the client transparently falls back to a simulation mode so
// the UI stays interactive.

export type PlcStatus = {
  connected: boolean;
  ip: string;
  rack: number;
  slot: number;
  inputs: {
    startForward: boolean; // I0.0
    stop: boolean;         // I0.1
    openLimit: boolean;    // I0.2
    closeLimit: boolean;   // I0.3
    startReverse: boolean; // I0.4
  };
  outputs: {
    forward: boolean; // Q0.0
    reverse: boolean; // Q0.1
  };
  memory: {
    forwardCmd: boolean; // M0.0
    reverseCmd: boolean; // M0.1
    stopCmd: boolean;    // M0.2
  };
  tags?: Record<string, boolean | number | null>;
  lastError?: string;
  simulated?: boolean;
  timestamp: number;
};

const API_BASE =
  (import.meta.env.VITE_HMI_API as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:4000";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

// ---------- Real API ----------
export const realApi = {
  connect: (ip: string, rack = 0, slot = 1) =>
    call<{ ok: boolean; message: string }>("/connect", {
      method: "POST",
      body: JSON.stringify({ ip, rack, slot }),
    }),
  disconnect: () =>
    call<{ ok: boolean; message: string }>("/disconnect", { method: "POST" }),
  status: () => call<PlcStatus>("/status"),
  forward: () => call<{ ok: boolean }>("/forward", { method: "POST" }),
  reverse: () => call<{ ok: boolean }>("/reverse", { method: "POST" }),
  stop: () => call<{ ok: boolean }>("/stop", { method: "POST" }),
};

// ---------- Simulation fallback ----------
// Mirrors the backend behavior so the UI works without a PLC.
class Simulator {
  state: PlcStatus = {
    connected: false,
    ip: "192.168.0.1",
    rack: 0,
    slot: 1,
    inputs: {
      startForward: false,
      stop: false,
      openLimit: false,
      closeLimit: false,
      startReverse: false,
    },
    outputs: { forward: false, reverse: false },
    memory: { forwardCmd: false, reverseCmd: false, stopCmd: false },
    tags: {},
    simulated: true,
    timestamp: Date.now(),
  };

  connect(ip: string, rack = 0, slot = 1) {
    this.state.ip = ip;
    this.state.rack = rack;
    this.state.slot = slot;
    this.state.connected = true;
    this.state.lastError = undefined;
    return { ok: true, message: `Simulated connection to ${ip}` };
  }

  disconnect() {
    this.state.connected = false;
    this.state.outputs.forward = false;
    this.state.outputs.reverse = false;
    return { ok: true, message: `Simulated disconnect from ${this.state.ip}` };
  }

  private tick() {
    // Translate memory commands -> outputs, enforce interlock.
    if (this.state.memory.stopCmd) {
      this.state.outputs.forward = false;
      this.state.outputs.reverse = false;
      this.state.memory.forwardCmd = false;
      this.state.memory.reverseCmd = false;
      this.state.memory.stopCmd = false;
    } else if (this.state.memory.forwardCmd && !this.state.memory.reverseCmd) {
      this.state.outputs.forward = true;
      this.state.outputs.reverse = false;
    } else if (this.state.memory.reverseCmd && !this.state.memory.forwardCmd) {
      this.state.outputs.reverse = true;
      this.state.outputs.forward = false;
    }

    // Simulate limit switches occasionally toggling
    if (this.state.outputs.forward) {
      this.state.inputs.closeLimit = false;
      if (Math.random() < 0.02) this.state.inputs.openLimit = true;
    }
    if (this.state.outputs.reverse) {
      this.state.inputs.openLimit = false;
      if (Math.random() < 0.02) this.state.inputs.closeLimit = true;
    }
    this.state.timestamp = Date.now();
  }

  status(): PlcStatus {
    if (this.state.connected) this.tick();
    return JSON.parse(JSON.stringify(this.state));
  }

  forward() {
    this.state.memory.forwardCmd = true;
    this.state.memory.reverseCmd = false;
    this.state.memory.stopCmd = false;
    return { ok: true };
  }
  reverse() {
    this.state.memory.reverseCmd = true;
    this.state.memory.forwardCmd = false;
    this.state.memory.stopCmd = false;
    return { ok: true };
  }
  stop() {
    this.state.memory.stopCmd = true;
    return { ok: true };
  }
}

const sim = new Simulator();

// ---------- Smart API with auto-fallback ----------
let useSim = false;
let probed = false;

async function probe() {
  if (probed) return;
  probed = true;
  try {
    await realApi.status();
    useSim = false;
  } catch {
    useSim = true;
  }
}

export const hmiApi = {
  isSimulated: () => useSim,
  async connect(ip: string, rack = 0, slot = 1) {
    await probe();
    try {
      const r = await realApi.connect(ip, rack, slot);
      useSim = false;
      return r;
    } catch {
      useSim = true;
      return sim.connect(ip, rack, slot);
    }
  },
  async disconnect() {
    if (useSim) return sim.disconnect();
    try {
      const r = await realApi.disconnect();
      return r;
    } catch {
      useSim = true;
      return sim.disconnect();
    }
  },
  async status(): Promise<PlcStatus> {
    if (useSim) return sim.status();
    try {
      return await realApi.status();
    } catch {
      useSim = true;
      return sim.status();
    }
  },
  async forward() {
    if (useSim) return sim.forward();
    try { return await realApi.forward(); } catch { useSim = true; return sim.forward(); }
  },
  async reverse() {
    if (useSim) return sim.reverse();
    try { return await realApi.reverse(); } catch { useSim = true; return sim.reverse(); }
  },
  async stop() {
    if (useSim) return sim.stop();
    try { return await realApi.stop(); } catch { useSim = true; return sim.stop(); }
  },
};
