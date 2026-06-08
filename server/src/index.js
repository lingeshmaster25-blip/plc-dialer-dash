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
  if (!def) return res.status(404).json({ ok: false, error: `Unknown tag: ${tag}` });
  if (def.type === "bool") {
    await plc.writeByAddr(def.address, Boolean(value));
  } else {
    await plc.writeByAddr(def.address, Number(value));
  }
  res.json({ ok: true });
}));

app.listen(PORT, () => {
  console.log(`[HMI backend] listening on http://localhost:${PORT}`);
  console.log(`[HMI backend] target PLC ${PLC_IP} rack=${PLC_RACK} slot=${PLC_SLOT}`);
});

// Graceful shutdown
const shutdown = () => { console.log("\n[shutdown] disconnecting PLC…"); plc.disconnect(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
