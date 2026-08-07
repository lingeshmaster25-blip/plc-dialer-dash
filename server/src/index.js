/**
 * Express HTTP API for the HMI frontend.
 * Endpoints:
 *   POST /connect   { ip, rack, slot }
 *   GET  /status
 *   POST /forward
 *   POST /reverse
 *   POST /stop
 */

// dotenv is a dev convenience for loading .env locally.
// In production (packaged Electron) env vars come from the parent process,
// so we don't want a missing dotenv to crash the backend.
try { require("dotenv").config(); } catch (_) { /* optional */ }
const express = require("express");
const cors = require("cors");
const { PlcService } = require("./plcService");
const { TAGS } = require("./tagCatalog");

const TAG_BY_NAME = new Map(TAGS.map((t) => [t.name, t]));

const PORT = Number(process.env.PORT || 4000);
const PLC_IP = process.env.PLC_IP || "192.168.0.1";
const PLC_RACK = Number(process.env.PLC_RACK || 0);
const PLC_SLOT = Number(process.env.PLC_SLOT || 1);
const POLL_MS = Number(process.env.POLL_MS || 500);

const plc = new PlcService({
  ip: PLC_IP, rack: PLC_RACK, slot: PLC_SLOT, pollMs: POLL_MS,
});

// Try initial connection (non-fatal)
plc.connect().catch((e) => console.warn("[boot] initial connect failed:", e.message));

const app = express();
app.use(cors());
app.use(express.json());

function asyncH(fn) {
  return (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
    console.error("[api]", e);
    res.status(500).json({ ok: false, error: e.message });
  });
}

app.post("/connect", asyncH(async (req, res) => {
  const { ip, rack, slot } = req.body || {};
  plc.disconnect();
  plc.configure({ ip, rack, slot });
  await plc.connect();
  res.json({ ok: true, message: `Connected to ${plc.ip}` });
}));

app.post("/disconnect", asyncH(async (_req, res) => {
  plc.disconnect();
  res.json({ ok: true, message: `Disconnected from ${plc.ip}` });
}));

app.get("/status", (_req, res) => res.json(plc.snapshot()));

app.post("/forward", asyncH(async (_req, res) => {
  await plc.commandForward();
  res.json({ ok: true });
}));

app.post("/reverse", asyncH(async (_req, res) => {
  await plc.commandReverse();
  res.json({ ok: true });
}));

app.post("/stop", asyncH(async (_req, res) => {
  await plc.commandStop();
  res.json({ ok: true });
}));

// Generic write keyed by tag name from the catalog.
// Supports bools (M/Q bits), ints (DB words), and reals (DB dwords).
// Body: { tag: "Start_PB", value: true }   or   { tag: "Stage1_Bin", value: 12 }
app.post("/write", asyncH(async (req, res) => {
  const { tag, value } = req.body || {};
  const def = TAG_BY_NAME.get(tag);
  if (!def) {
    console.warn(`[write] UNKNOWN TAG "${tag}" — check that server and client tag catalogs match`);
    return res.status(404).json({ ok: false, error: `Unknown tag: ${tag}` });
  }
  const v = def.type === "bool" ? Boolean(value) : Number(value);
  try {
    await plc.writeByAddr(def.address, v);
    // This log line is ground truth: it shows exactly what was written and to
    // which absolute PLC address. Match `address` against your TIA watch table
    // (e.g. MW14 => %MW14, M0.0 => %M0.0). If you see this line but TIA shows
    // nothing, you are watching a different address than the app writes.
    console.log(`[write] ${tag} = ${v}  ->  ${def.address}  (${plc.connected ? "LIVE PLC" : "NOT CONNECTED"})`);
    res.json({ ok: true, tag, address: def.address, value: v, connected: plc.connected });
  } catch (e) {
    console.error(`[write] ${tag} -> ${def.address} FAILED: ${e.message}`);
    res.status(500).json({ ok: false, error: e.message, tag, address: def.address });
  }
}));

// Debug: read one tag's current value from the latest poll snapshot.
// Use it to compare against TIA:  GET /read/SelectedBin
app.get("/read/:tag", (req, res) => {
  const def = TAG_BY_NAME.get(req.params.tag);
  if (!def) return res.status(404).json({ ok: false, error: `Unknown tag: ${req.params.tag}` });
  const snap = plc.snapshot();
  res.json({
    ok: true, tag: req.params.tag, address: def.address,
    value: snap.tags?.[req.params.tag] ?? null,
    connected: snap.connected, simulated: snap.simulated,
  });
});

app.listen(PORT, () => {
  console.log(`[HMI backend] listening on http://localhost:${PORT}`);
  console.log(`[HMI backend] target PLC ${PLC_IP} rack=${PLC_RACK} slot=${PLC_SLOT}`);
});

// Graceful shutdown
const shutdown = () => { console.log("\n[shutdown] disconnecting PLC…"); plc.disconnect(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
