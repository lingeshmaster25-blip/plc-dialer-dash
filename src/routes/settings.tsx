import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type Tab = "PLC Connection" | "Machine" | "Trays & Columns" | "Users";
type LogEntry = { text: string; color: string };
type ConnectionState = "disconnected" | "connecting" | "connected";

const TAG_MAP = [
  { tag: "DB1.MachineState", dir: "IN", address: "40001 - INT",  value: "2"    },
  { tag: "DB1.CurrentTray",  dir: "IN", address: "40002 - INT",  value: "38"   },
  { tag: "DB1.TrayPresent",  dir: "IN", address: "10001 - BOOL", value: "1"    },
  { tag: "DB1.DriverTemp",   dir: "IN", address: "40010 - REAL", value: "46.50"},
  { tag: "DB1.AirPressure",  dir: "IN", address: "40020 - WORD", value: "6.12" },
  { tag: "DB1.EStop",        dir: "IN", address: "00003 - BOOL", value: "0"    },
];

const FIELD: React.CSSProperties = {
  width: "100%", background: "#f0f1f3", border: "1px solid #d8dbe0",
  borderRadius: 8, padding: "11px 14px", fontSize: 15, color: "#111827",
  outline: "none", boxSizing: "border-box",
};
const SECTION_LABEL: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.7px", marginBottom: 10,
};
const TH: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: "#6b7280", letterSpacing: "0.4px", padding: "10px 0",
  borderBottom: "1px solid #e5e7eb",
};
const CARD: React.CSSProperties = {
  border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px",
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 48, height: 27, borderRadius: 999, cursor: "pointer",
        background: on ? "#2563eb" : "#d1d5db",
        position: "relative", transition: "background .2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 21, height: 21, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left .2s",
      }} />
    </div>
  );
}

// ── Field card ────────────────────────────────────────────────────────────────
function FieldCard({ label, placeholder, unit }: { label: string; placeholder: string; unit?: string }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ ...CARD, padding: "12px 16px" }}>
      <div style={{ ...SECTION_LABEL, marginBottom: 7 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          style={{ ...FIELD, padding: "9px 12px", paddingRight: unit ? 70 : 12, fontSize: 14 }}
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        {unit && (
          <span style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 12, color: "#9ca3af", pointerEvents: "none",
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Machine tab ───────────────────────────────────────────────────────────────
function MachineTab() {
  const [consolidate, setConsolidate] = useState(true);
  const [putToLight,  setPutToLight]  = useState(true);
  const [weightCheck, setWeightCheck] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* top row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <FieldCard label="MACHINE ID"       placeholder="Enter Machine Name" />
        <FieldCard label="COLUMNS"          placeholder="Enter Columns"      unit="front / back" />
        <FieldCard label="TRAY CAPACITY"    placeholder="Enter Capacity"     unit="trays" />
      </div>
      {/* bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <FieldCard label="BAY OPENING HEIGHT" placeholder="Enter Machine Name" unit="mm" />
        <FieldCard label="MAX TRAY LOAD"      placeholder="Enter Columns"      unit="kg" />
        <FieldCard label="MAX BOXES / CYCLE"  placeholder="Enter Capacity"     unit="boxes" />
      </div>

      {/* Pick behaviour */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 18px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>Pick behaviour</div>
        {[
          { label: "Consolidate across trays", sub: "Group up to 9 boxes from different trays into one batch", on: consolidate, set: setConsolidate },
          { label: "Put-to-light at bay",       sub: "Illuminate the target bin via PLC output",               on: putToLight,  set: setPutToLight  },
          { label: "Weight check on pick",      sub: "Verify quantity from bay load-cell tag",                 on: weightCheck, set: setWeightCheck  },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 0",
            borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{row.label}</div>
              <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 1 }}>{row.sub}</div>
            </div>
            <Toggle on={row.on} onChange={row.set} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PLC Connection tab ────────────────────────────────────────────────────────
function PlcTab() {
  const [protocol, setProtocol]   = useState("");
  const [ip, setIp]               = useState("");
  const [port, setPort]           = useState("");
  const [connState, setConnState] = useState<ConnectionState>("disconnected");
  const [log, setLog]             = useState<LogEntry[]>([
    { text: "TCP Connect 192.168.1.10:502",       color: "#4ade80" },
    { text: "handshake OK — unit 1, scan 100ms",  color: "#4ade80" },
    { text: "polling 12 input tags @ 10 Hz",      color: "#e5e7eb" },
    { text: "Disconnected by Operator",            color: "#f87171" },
  ]);

  const pushLog = (text: string, color: string) =>
    setLog((prev) => [...prev, { text, color }]);

  const handleConnect = () => {
    if (!ip.trim() || !port.trim()) { pushLog("Error: IP and Port are required.", "#f87171"); return; }
    setConnState("connecting");
    pushLog(`Connecting to ${ip}:${port}…`, "#facc15");
    setTimeout(() => {
      setConnState("connected");
      pushLog(`TCP Connect ${ip}:${port}`, "#4ade80");
      pushLog("handshake OK — unit 1, scan 100ms", "#4ade80");
    }, 1200);
  };

  const handleDisconnect = () => {
    setConnState("disconnected");
    pushLog("Disconnected by Operator", "#f87171");
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 18 }}>

      {/* LEFT column: field cards on top + tag map below */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* 3 field cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 14, flexShrink: 0 }}>
          <div style={{ ...CARD, padding: "14px 16px" }}>
            <div style={SECTION_LABEL}>PROTOCOL</div>
            <div style={{ position: "relative" }}>
              <select value={protocol} onChange={(e) => setProtocol(e.target.value)}
                style={{ ...FIELD, appearance: "none", cursor: "pointer", color: protocol ? "#111827" : "#9ca3af" }}>
                <option value="" disabled>Select Protocol</option>
                <option>Modbus TCP</option>
                <option>S7 (Siemens)</option>
                <option>EtherNet/IP</option>
                <option>OPC-UA</option>
              </select>
              <ChevronDown size={16} color="#6b7280" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>
          <div style={{ ...CARD, padding: "14px 16px" }}>
            <div style={SECTION_LABEL}>CONTROLLER IP</div>
            <input style={FIELD} placeholder="Enter IP Address" value={ip} onChange={(e) => setIp(e.target.value)} />
          </div>
          <div style={{ ...CARD, padding: "14px 16px" }}>
            <div style={SECTION_LABEL}>PORT</div>
            <input style={FIELD} placeholder="Enter Port Address" value={port} onChange={(e) => setPort(e.target.value)} />
          </div>
        </div>

        {/* Tag map — takes all remaining height in left column */}
        <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={SECTION_LABEL}>TAG MAP</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <span style={TH}>TAG</span>
            <span style={{ ...TH, textAlign: "center" }}>DIR</span>
            <span style={TH}>ADDRESS</span>
            <span style={TH}>VALUE</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {TAG_MAP.map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                padding: "11px 0", alignItems: "center",
                borderBottom: i < TAG_MAP.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ fontSize: 14, color: "#1f2937", fontWeight: 500 }}>{row.tag}</span>
                <span style={{ textAlign: "center" }}>
                  <span style={{ background: "#bfdbfe", color: "#1d4ed8", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
                    {row.dir}
                  </span>
                </span>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{row.address}</span>
                <span style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT column: Connection Log — full height, parallel to left */}
      <div style={{ width: 260, flexShrink: 0, ...CARD, display: "flex", flexDirection: "column", gap: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Connection Log</div>
        <div style={{
          background: "#0f172a", borderRadius: 8, padding: "12px 14px",
          flex: 1, minHeight: 0, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 7,
        }}>
          {log.map((e, i) => (
            <span key={i} style={{ fontSize: 13, color: e.color, lineHeight: 1.5 }}>• {e.text}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={handleDisconnect} disabled={connState === "disconnected"} style={{
            flex: 1, padding: "11px 0", borderRadius: 8, border: "none", fontWeight: 700,
            fontSize: 14, cursor: connState === "disconnected" ? "not-allowed" : "pointer",
            background: connState === "disconnected" ? "#fca5a5" : "#ef4444", color: "#fff",
          }}>Disconnect</button>
          <button onClick={handleConnect} disabled={connState === "connected"} style={{
            flex: 1, padding: "11px 0", borderRadius: 8, border: "none", fontWeight: 700,
            fontSize: 14, cursor: connState === "connected" ? "not-allowed" : "pointer",
            background: connState === "connected" ? "#6ee7b7" : "#16a34a", color: "#fff",
          }}>{connState === "connecting" ? "Connecting…" : "Connect"}</button>
        </div>
      </div>

    </div>
  );
}

// ── Users tab ────────────────────────────────────────────────────────────────
type User = { name: string; role: string; badge: string; lastActive: string };

const SEED_USERS: User[] = [
  { name: "Kumar",  role: "Operator",   badge: "B-2041", lastActive: "now"       },
  { name: "Sharma", role: "Supervisor", badge: "B-1180", lastActive: "2h ago"    },
  { name: "Iyer",   role: "Technician", badge: "B-0033", lastActive: "yesterday" },
];

function UsersTab() {
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<User>({ name: "", role: "", badge: "", lastActive: "now" });

  const handleAdd = () => {
    if (!draft.name.trim() || !draft.role.trim() || !draft.badge.trim()) return;
    setUsers((prev) => [...prev, { ...draft, lastActive: "now" }]);
    setDraft({ name: "", role: "", badge: "", lastActive: "now" });
    setAdding(false);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        {/* card header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>Operators & access</span>
          <button onClick={() => setAdding(true)} style={{
            background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 600,
            border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer",
          }}>Add User</button>
        </div>

        {/* table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 22px", borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
          {["NAME", "ROLE", "BADGE", "LAST ACTIVE"].map((h) => (
            <span key={h} style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.5px" }}>{h}</span>
          ))}
        </div>

        {/* rows */}
        {users.map((u, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
            padding: "14px 22px", alignItems: "center",
            borderBottom: i < users.length - 1 ? "1px solid #f3f4f6" : "none",
            background: "#fff",
          }}>
            <span style={{ fontSize: 15, color: "#1f2937", fontWeight: 500 }}>{u.name}</span>
            <span style={{ fontSize: 15, color: "#1f2937" }}>{u.role}</span>
            <span style={{ fontSize: 15, color: "#1f2937" }}>{u.badge}</span>
            <span style={{ fontSize: 15, color: "#6b7280" }}>{u.lastActive}</span>
          </div>
        ))}

        {/* inline add row */}
        {adding && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 22px", gap: 12, borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
            {(["name", "role", "badge"] as const).map((field) => (
              <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={draft[field]} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 12px", fontSize: 14, outline: "none" }} />
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleAdd} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "8px 0" }}>Save</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "8px 0" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trays & Columns tab ──────────────────────────────────────────────────────
const TRAY_ROWS = [
  { tray: "T-07", column: "Front", partition: "24-bin grid", bins: 24, free: 5,  height: "75 mm"  },
  { tray: "T-15", column: "Back",  partition: "12-bin wide", bins: 12, free: 3,  height: "150 mm" },
  { tray: "T-12", column: "Back",  partition: "6-bin deep",  bins: 6,  free: 2,  height: "225 mm" },
];

function TraysTab() {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        {/* card header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 22px", borderBottom: "1px solid #e5e7eb",
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>Tray definitions</span>
          <span style={{ fontSize: 14, color: "#6b7280" }}>{TRAY_ROWS.length * 17 - 34} active</span>
        </div>

        {/* table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 0.8fr 0.8fr 1fr",
          padding: "10px 22px", borderBottom: "1px solid #e5e7eb", background: "#fafafa",
        }}>
          {["TRAY", "COLUMN", "PARTITION", "BINS", "FREE", "HEIGHT"].map((h) => (
            <span key={h} style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.5px" }}>{h}</span>
          ))}
        </div>

        {/* rows */}
        {TRAY_ROWS.map((row, i) => (
          <div key={row.tray} style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 0.8fr 0.8fr 1fr",
            padding: "14px 22px", alignItems: "center",
            borderBottom: i < TRAY_ROWS.length - 1 ? "1px solid #f3f4f6" : "none",
            background: "#fff",
          }}>
            <span style={{ fontSize: 15, color: "#1f2937", fontWeight: 500 }}>{row.tray}</span>
            <span style={{ fontSize: 15, color: "#1f2937" }}>{row.column}</span>
            <span style={{ fontSize: 15, color: "#1f2937" }}>{row.partition}</span>
            <span style={{ fontSize: 15, color: "#1f2937" }}>{row.bins}</span>
            <span style={{ fontSize: 15, color: "#1f2937" }}>{row.free}</span>
            <span style={{ fontSize: 15, color: "#1f2937" }}>{row.height}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("PLC Connection");
  const TABS: Tab[] = ["PLC Connection", "Machine", "Trays & Columns", "Users"];

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "22px 32px", display: "flex", flexDirection: "column" }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Settings Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>System configuration</p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 0", flexShrink: 0 }} />

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 22, flexShrink: 0 }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "12px 26px", fontSize: 15, fontWeight: 600, border: "none",
              background: "none", cursor: "pointer",
              color: activeTab === t ? "#2563eb" : "#6b7280",
              borderBottom: activeTab === t ? "2.5px solid #2563eb" : "2.5px solid transparent",
              marginBottom: -1, transition: "color .12s",
            }}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === "PLC Connection" && <PlcTab />}
        {activeTab === "Machine"        && <MachineTab />}
        {activeTab === "Trays & Columns" && <TraysTab />}
        {activeTab === "Users" && <UsersTab />}
      </div>
    </DashboardShell>
  );
}
