import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
});

const MASTER_USER = "UID001";
const MASTER_KEY = "Trilo@2026";

const CRED_FIELD: React.CSSProperties = {
  width: "100%", background: "#e3e5e8", border: "1px solid #d7dade",
  borderRadius: 10, padding: "15px 18px", fontSize: 16, color: "#111827",
  outline: "none", boxSizing: "border-box",
};

type Signal = { name: string; addr: string; on: boolean };
type Register = { name: string; addr: string; value: string };

// ── OUTPUT STATUS ──
const DOOR_CMDS: Signal[] = [
  { name: "DOOR OPEN", addr: "Q0.0", on: true },
  { name: "DOOR CLOSE", addr: "Q0.1", on: false },
];
const AXIS_DRIVE: Signal[] = [
  { name: "Y UP", addr: "Q0.2", on: true }, { name: "Y DOWN", addr: "Q0.3", on: false },
  { name: "X LEFT", addr: "Q0.4", on: true }, { name: "X RIGHT", addr: "Q0.5", on: false },
  { name: "A FORWARD", addr: "Q0.6", on: true }, { name: "A REVERSE", addr: "Q0.7", on: false },
  { name: "B FORWARD", addr: "Q1.0", on: true }, { name: "B REVERSE", addr: "Q1.1", on: false },
  { name: "Z UP", addr: "Q1.2", on: true }, { name: "Z DOWN", addr: "Q1.3", on: false },
];
const SYSTEM: Signal[] = [
  { name: "CYCLE COMPLETE", addr: "Q1.5", on: true },
  { name: "FAULT ALARM", addr: "Q1.6", on: false },
  { name: "H RUN", addr: "M6.1", on: false },
  { name: "OVER LOAD", addr: "M8.0", on: false },
  { name: "BIN OVER HEIGHT", addr: "M8.1", on: true },
  { name: "BIN STORE COMPLETE", addr: "M8.2", on: false },
];

// ── SENSOR STATUS ──
const DOOR_SENSORS: Signal[] = [
  { name: "DOOR OPENED", addr: "I0.0", on: true },
  { name: "DOOR CLOSED", addr: "I0.1", on: false },
];
const POSITION_SENSORS: Signal[] = [
  { name: "Y HOME", addr: "I0.2", on: true }, { name: "Y LIMIT", addr: "I0.3", on: false },
  { name: "X HOME", addr: "I0.4", on: true }, { name: "X LIMIT", addr: "I0.5", on: false },
  { name: "Z HOME", addr: "I0.6", on: true }, { name: "Z LIMIT", addr: "I0.7", on: false },
];
const SAFETY_SENSORS: Signal[] = [
  { name: "LIGHT CURTAIN", addr: "I1.0", on: true },
  { name: "E-STOP OK", addr: "I1.1", on: true },
  { name: "AIR PRESSURE", addr: "I1.2", on: true },
  { name: "TRAY PRESENT", addr: "I1.3", on: false },
];

// ── LIVE MONITOR ──
const LIVE_REGISTERS: Register[] = [
  { name: "CYCLE COUNT", addr: "DB10.DBW0", value: "1432" },
  { name: "CURRENT TRAY", addr: "DB10.DBW2", value: "12" },
  { name: "X POSITION (mm)", addr: "DB10.DBW4", value: "845" },
  { name: "Y POSITION (mm)", addr: "DB10.DBW6", value: "1320" },
  { name: "Z POSITION (mm)", addr: "DB10.DBW8", value: "60" },
  { name: "MOTOR TEMP (°C)", addr: "DB10.DBW10", value: "41" },
];

function SignalRow({ s }: { s: Signal }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: s.on ? "#ffffff" : "#e8eaed",
      border: s.on ? "1px solid #e2e4e7" : "1px solid #dfe1e4",
      borderRadius: 10, padding: "12px 16px", minWidth: 0,
    }}>
      <span style={{
        width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
        background: s.on ? "#1ed760" : "#b6bbc2",
        boxShadow: s.on ? "0 0 8px 1px rgba(30,215,96,0.6)" : "none",
      }} />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{s.addr}</span>
      </div>
      <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 600, color: s.on ? "#1a1a1a" : "#9ca3af" }}>
        {s.on ? 1 : 0}
      </span>
    </div>
  );
}

function RegisterRow({ r }: { r: Register }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "#ffffff", border: "1px solid #e2e4e7",
      borderRadius: 10, padding: "12px 16px", minWidth: 0,
    }}>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{r.name}</span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{r.addr}</span>
      </div>
      <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 700, color: "#0058f1" }}>{r.value}</span>
    </div>
  );
}

function IOCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 3px rgba(16,24,40,0.06)" }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#374151", letterSpacing: "0.04em" }}>{title}</span>
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const col1: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 12 };

/** Person + wrench line illustration for the credential gate. */
function MaintIllustration() {
  return (
    <svg viewBox="0 0 380 340" width="86%" style={{ maxWidth: 360 }} xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#c2c6cc" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="145" cy="122" r="58" />
        <path d="M55 308 C55 232 98 200 145 200 C192 200 235 232 235 308" />
        <circle cx="278" cy="140" r="70" fill="#ffffff" />
      </g>
      <g transform="translate(238.5,100.5) scale(3.3)" fill="none" stroke="#c2c6cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </g>
    </svg>
  );
}

function MaintenancePage() {
  const [userId, setUserId] = useState("");
  const [passkey, setPasskey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"output" | "sensor" | "live">("output");

  const grantAccess = () => {
    const idOk = userId.trim().toLowerCase() === MASTER_USER.toLowerCase();
    const keyOk = passkey.trim() === MASTER_KEY;
    if (idOk && keyOk) { setUnlocked(true); setError(false); }
    else setError(true);
  };

  const TabBtn = ({ id, label }: { id: "output" | "sensor" | "live"; label: string }) => {
    const active = tab === id;
    return (
      <span
        onClick={() => setTab(id)}
        style={{
          fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer",
          color: active ? "#0058f1" : "#9ca3af", paddingBottom: 10, marginBottom: -1,
          borderBottom: active ? "3px solid #0058f1" : "3px solid transparent",
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Maintenance Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
          Machine vitals, calibration &amp; live PLC I/O
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 16px", flexShrink: 0 }} />

        {!unlocked ? (
          /* ── CREDENTIAL GATE ── */
          <div style={{ display: "flex", gap: 40, flex: 1, minHeight: 0, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <MaintIllustration />
            </div>
            <div style={{ flex: 1.1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 500, color: "#1f2937", marginBottom: 22 }}>
                Enter User Credentials to use Maintenance mode
              </span>

              <label style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>User ID</label>
              <input
                style={CRED_FIELD}
                placeholder="Enter user ID"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") grantAccess(); }}
              />

              <label style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", margin: "20px 0 8px" }}>Passkey</label>
              <input
                style={CRED_FIELD}
                type="password"
                placeholder="Enter passkey"
                value={passkey}
                onChange={(e) => { setPasskey(e.target.value); setError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") grantAccess(); }}
              />

              {error && (
                <span style={{ fontSize: 14, color: "#dc2626", fontWeight: 600, marginTop: 12 }}>
                  Invalid User ID or Passkey.
                </span>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 34 }}>
                <button
                  onClick={grantAccess}
                  style={{
                    background: "#28954b", color: "#fff", fontWeight: 700, fontSize: 19,
                    border: "none", borderRadius: 10, padding: "15px 40px", cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(40,149,75,0.30)", transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1e8449"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#28954b"; }}
                >
                  Grant Access
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── UNLOCKED: live PLC I/O ── */
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

            {/* tabs */}
            <div style={{ display: "flex", gap: 36, borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
              <TabBtn id="output" label="OUTPUT STATUS" />
              <TabBtn id="sensor" label="SENSOR STATUS" />
              <TabBtn id="live" label="LIVE MONITOR" />
            </div>

            {/* tab content */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: 18, paddingRight: 4 }}>

              {tab === "output" && (
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                  <div style={{ flex: 1.3, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
                    <IOCard title="DOOR COMMANDS">
                      <div style={grid2}>{DOOR_CMDS.map((s) => <SignalRow key={s.addr} s={s} />)}</div>
                    </IOCard>
                    <IOCard title="AXIS DRIVE">
                      <div style={grid2}>{AXIS_DRIVE.map((s) => <SignalRow key={s.addr} s={s} />)}</div>
                    </IOCard>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <IOCard title="SYSTEM">
                      <div style={col1}>{SYSTEM.map((s) => <SignalRow key={s.addr} s={s} />)}</div>
                    </IOCard>
                  </div>
                </div>
              )}

              {tab === "sensor" && (
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                  <div style={{ flex: 1.3, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
                    <IOCard title="DOOR SENSORS">
                      <div style={grid2}>{DOOR_SENSORS.map((s) => <SignalRow key={s.addr} s={s} />)}</div>
                    </IOCard>
                    <IOCard title="POSITION SENSORS">
                      <div style={grid2}>{POSITION_SENSORS.map((s) => <SignalRow key={s.addr} s={s} />)}</div>
                    </IOCard>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <IOCard title="SAFETY">
                      <div style={col1}>{SAFETY_SENSORS.map((s) => <SignalRow key={s.addr} s={s} />)}</div>
                    </IOCard>
                  </div>
                </div>
              )}

              {tab === "live" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <IOCard title="LIVE REGISTERS">
                    <div style={grid2}>{LIVE_REGISTERS.map((r) => <RegisterRow key={r.addr} r={r} />)}</div>
                  </IOCard>
                  <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                    Live register values are simulated in this build. Connect the PLC link to stream real-time data.
                  </p>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
