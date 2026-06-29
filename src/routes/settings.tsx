import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

// ── types ────────────────────────────────────────────────────────────────────
type Tab = "PLC Connection" | "Machine" | "Trays & Columns" | "Users";
type LogEntry = { text: string; color: string };
type ConnectionState = "disconnected" | "connecting" | "connected";

// ── static tag map ────────────────────────────────────────────────────────────
const TAG_MAP = [
  { tag: "DB1.MachineState", dir: "IN", address: "40001 - INT",  value: "2"    },
  { tag: "DB1.CurrentTray",  dir: "IN", address: "40002 - INT",  value: "38"   },
  { tag: "DB1.TrayPresent",  dir: "IN", address: "10001 - BOOL", value: "1"    },
  { tag: "DB1.DriverTemp",   dir: "IN", address: "40010 - REAL", value: "46.50"},
  { tag: "DB1.AirPressure",  dir: "IN", address: "40020 - WORD", value: "6.12" },
  { tag: "DB1.EStop",        dir: "IN", address: "00003 - BOOL", value: "0"    },
];

// ── styles ───────────────────────────────────────────────────────────────────
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

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("PLC Connection");
  const [protocol, setProtocol]   = useState("");
  const [ip, setIp]               = useState("");
  const [port, setPort]           = useState("");
  const [connState, setConnState] = useState<ConnectionState>("disconnected");
  const [log, setLog]             = useState<LogEntry[]>([
    { text: "TCP Connect 192.168.1.10:502",        color: "#4ade80" },
    { text: "handshake OK — unit 1, scan 100ms",   color: "#4ade80" },
    { text: "polling 12 input tags @ 10 Hz",       color: "#e5e7eb" },
    { text: "Disconnected by Operator",             color: "#f87171" },
  ]);

  const pushLog = (text: string, color: string) =>
    setLog((prev) => [...prev, { text, color }]);

  const handleConnect = () => {
    if (!ip.trim() || !port.trim()) {
      pushLog("Error: IP and Port are required.", "#f87171");
      return;
    }
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

  const TABS: Tab[] = ["PLC Connection", "Machine", "Trays & Columns", "Users"];

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "22px 32px", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Settings Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>System configuration</p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 0", flexShrink: 0 }} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb", marginBottom: 22, flexShrink: 0 }}>
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

        {/* ── PLC Connection tab ── */}
        {activeTab === "PLC Connection" && (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* top row: protocol / ip / port / connection log */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr 1.1fr", gap: 18, alignItems: "start" }}>

              {/* Protocol */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
                <div style={SECTION_LABEL}>PROTOCOL</div>
                <div style={{ position: "relative" }}>
                  <select value={protocol} onChange={(e) => setProtocol(e.target.value)}
                    style={{ ...FIELD, appearance: "none", cursor: "pointer", color: protocol ? "#111827" : "#9ca3af" }}>
                    <option value="" disabled>Select Protocol</option>
                    <option value="Modbus TCP">Modbus TCP</option>
                    <option value="S7">S7 (Siemens)</option>
                    <option value="EtherNet/IP">EtherNet/IP</option>
                    <option value="OPC-UA">OPC-UA</option>
                  </select>
                  <ChevronDown size={16} color="#6b7280" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>

              {/* Controller IP */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
                <div style={SECTION_LABEL}>CONTROLLER IP</div>
                <input style={FIELD} placeholder="Enter IP Address" value={ip}
                  onChange={(e) => setIp(e.target.value)} />
              </div>

              {/* Port */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
                <div style={SECTION_LABEL}>PORT</div>
                <input style={FIELD} placeholder="Enter Port Address" value={port}
                  onChange={(e) => setPort(e.target.value)} />
              </div>

              {/* Connection log */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>Connection Log</div>
                <div style={{
                  background: "#0f172a", borderRadius: 8, padding: "12px 14px",
                  flex: 1, minHeight: 120, maxHeight: 160, overflowY: "auto",
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  {log.map((entry, i) => (
                    <span key={i} style={{ fontSize: 13, color: entry.color, lineHeight: 1.4 }}>
                      • {entry.text}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={handleDisconnect}
                    disabled={connState === "disconnected"}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                      fontWeight: 700, fontSize: 14, cursor: connState === "disconnected" ? "not-allowed" : "pointer",
                      background: connState === "disconnected" ? "#fca5a5" : "#ef4444",
                      color: "#fff", transition: "background .15s",
                    }}>
                    Disconnect
                  </button>
                  <button onClick={handleConnect}
                    disabled={connState === "connected"}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                      fontWeight: 700, fontSize: 14, cursor: connState === "connected" ? "not-allowed" : "pointer",
                      background: connState === "connected" ? "#6ee7b7" : "#16a34a",
                      color: "#fff", transition: "background .15s",
                    }}>
                    {connState === "connecting" ? "Connecting…" : "Connect"}
                  </button>
                </div>
              </div>
            </div>

            {/* Tag map */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 24px", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={SECTION_LABEL}>TAG MAP</div>
              <div style={{ display: "grid", gridTemplateColumns: "1.8fr 80px 1.4fr 1fr", gap: 0 }}>
                <span style={TH}>TAG</span>
                <span style={{ ...TH, textAlign: "center" }}>DIR</span>
                <span style={TH}>ADDRESS</span>
                <span style={{ ...TH, textAlign: "right" }}>VALUE</span>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {TAG_MAP.map((row, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1.8fr 80px 1.4fr 1fr",
                    padding: "12px 0", borderBottom: i < TAG_MAP.length - 1 ? "1px solid #f3f4f6" : "none",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: 15, color: "#1f2937", fontWeight: 500 }}>{row.tag}</span>
                    <span style={{ textAlign: "center" }}>
                      <span style={{
                        background: "#bfdbfe", color: "#1d4ed8", fontSize: 12,
                        fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                      }}>
                        {row.dir}
                      </span>
                    </span>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>{row.address}</span>
                    <span style={{ fontSize: 15, color: "#1a1a1a", fontWeight: 600, textAlign: "right" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── placeholder tabs ── */}
        {activeTab !== "PLC Connection" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 16 }}>
            {activeTab} configuration coming soon.
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
