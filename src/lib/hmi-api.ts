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
  writeTag: (tag: string, value: boolean | number) =>
    call<{ ok: boolean }>("/write", {
      method: "POST",
      body: JSON.stringify({ tag, value }),
    }),
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

  // Internal sim state for axes + watch values so the Live Monitor
  // shows realistic moving numbers when no PLC is connected.
  private axes = {
    Y: { target: 120.0, actual: 0 },
    X: {  target: 80.5, actual: 0 },
    A: {  target: 45.25, actual: 0 },
    B: {  target: 60.0, actual: 0 },
    Z: {  target: 30.0, actual: 0 },
  };
  private watch = {
    Step: 0,
    CurrentStage: 1,
    SelectedBin: 0,
    RackNo: 0,
    RackBin: 0,
  };

  constructor() {
    // Seed tags so the Live Monitor shows numbers immediately
    // (even before the user hits Connect).
    if (!this.state.tags) this.state.tags = {};
    for (const [name, ax] of Object.entries(this.axes)) {
      this.state.tags[`${name}_Target`] = ax.target;
      this.state.tags[`${name}_ActualPos`] = ax.actual;
    }
    this.state.tags.Step = this.watch.Step;
    this.state.tags.CurrentStage = this.watch.CurrentStage;
    this.state.tags.SelectedBin = this.watch.SelectedBin;
    this.state.tags.RackNo = this.watch.RackNo;
    this.state.tags.RackBin = this.watch.RackBin;
  }

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

    // --- Animate axes + watch values for the Live Monitor ---
    if (!this.state.tags) this.state.tags = {};

    // Occasionally pick new random targets so values keep moving
    if (Math.random() < 0.008) {
      for (const ax of Object.values(this.axes)) {
        ax.target = Math.round((Math.random() * 250 + 5) * 100) / 100;
      }
    }

    // Each tick, move actual toward target (max step 1.5 units)
    for (const [name, ax] of Object.entries(this.axes)) {
      const delta = ax.target - ax.actual;
      const step = Math.sign(delta) * Math.min(Math.abs(delta), 1.5);
      ax.actual = Math.round((ax.actual + step) * 100) / 100;
      this.state.tags[`${name}_Target`] = ax.target;
      this.state.tags[`${name}_ActualPos`] = ax.actual;
    }

    // Watch values: Step counts, CurrentStage cycles 1..5, Rack/Bin drift
    this.watch.Step = (this.watch.Step + 1) % 1000;
    if (this.watch.Step % 200 === 0) {
      this.watch.CurrentStage = (this.watch.CurrentStage % 5) + 1;
      this.watch.SelectedBin = Math.floor(Math.random() * 85) + 1;
    }
    if (Math.random() < 0.05) {
      this.watch.RackNo = Math.floor(Math.random() * 20) + 1;
      this.watch.RackBin = Math.floor(Math.random() * 12) + 1;
    }
    this.state.tags.Step = this.watch.Step;
    this.state.tags.CurrentStage = this.watch.CurrentStage;
    this.state.tags.SelectedBin = this.watch.SelectedBin;
    this.state.tags.RackNo = this.watch.RackNo;
    this.state.tags.RackBin = this.watch.RackBin;

    this.state.timestamp = Date.now();
  }

  status(): PlcStatus {
    // Always tick so the Live Monitor stays animated even before Connect.
    this.tick();
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

  writeTag(tag: string, value: boolean | number) {
    if (!this.state.tags) this.state.tags = {};
    this.state.tags[tag] = value as boolean | number;
    // Mirror well-known M0.x forces into the legacy memory/output fields
    if (tag === "Start_PB") {
      const b = Boolean(value);
      this.state.memory.forwardCmd = b;
      if (b) {
        this.state.memory.reverseCmd = false;
        this.state.memory.stopCmd = false;
      }
    } else if (tag === "Stop_PB") {
      const b = Boolean(value);
      this.state.memory.reverseCmd = b;
      if (b) {
        this.state.memory.forwardCmd = false;
        this.state.memory.stopCmd = false;
      }
    } else if (tag === "Reset_PB") {
      this.state.memory.stopCmd = Boolean(value);
    }
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
      const s = await realApi.status();
      // Backend is reachable but no PLC is hooked up (tags empty) —
      // tick the simulator so the Live Monitor keeps moving instead of
      // showing "—" everywhere. Real values, when present, take priority.
      const simS = sim.status();
      const realTags = s.tags ?? {};
      const merged: Record<string, boolean | number | null> = { ...(simS.tags ?? {}) };
      for (const [k, v] of Object.entries(realTags)) {
        if (v !== null && v !== undefined) merged[k] = v;
      }
      s.tags = merged;
      return s;
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
  async writeTag(tag: string, value: boolean | number) {
    if (useSim) return sim.writeTag(tag, value);
    try { return await realApi.writeTag(tag, value); }
    catch { useSim = true; return sim.writeTag(tag, value); }
  },
};
