import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/troubleshoot")({
  component: TroubleshootPage,
});

type Alert = { id: number; tone: "red" | "yellow" | "blue"; title: string; detail: string };

const TONE: Record<Alert["tone"], { box: string; icon: string }> = {
  red: { box: "#fde2e2", icon: "#db0000" },
  yellow: { box: "#fff7d6", icon: "#eab308" },
  blue: { box: "#dbeeff", icon: "#2b8fff" },
};

const INITIAL_ALERTS: Alert[] = [
  { id: 1, tone: "red", title: "Front photocell drift", detail: "Front-left bay sensor reads 4 mm off target — fault word bit 4. Run bay calibration." },
  { id: 2, tone: "yellow", title: "Air pressure below setpoint", detail: "Live tag DB1.AirPressure 6.1 bar vs 6.5 setpoint." },
  { id: 3, tone: "blue", title: "Tray T-51 capacity low", detail: "3 of 24 bins free — schedule put-away." },
];

const FIELD: React.CSSProperties = {
  width: "100%", background: "#dcdde0", border: "1px solid #d0d1d5",
  borderRadius: 8, padding: "14px 18px", fontSize: 16, color: "#111827",
  outline: "none", boxSizing: "border-box",
};

function TroubleshootPage() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);

  const acknowledge = (id: number) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <h1 style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Troubleshoot Overview
        </h1>
        <p style={{ fontSize: 16, color: "#6b7280", margin: "5px 0 0" }}>Active faults, alerts &amp; manual control</p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "16px 0 18px", flexShrink: 0 }} />

        {/* Two columns */}
        <div style={{ display: "flex", gap: 30, flex: 1, minHeight: 0, alignItems: "stretch" }}>

          {/* ── ACTIVE ALERTS ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{
              border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>Active Alerts</span>
                <span style={{ background: "#ededed", color: "#4b5563", fontSize: 14, fontWeight: 500, padding: "5px 14px", borderRadius: 999 }}>
                  {alerts.length} Alert{alerts.length === 1 ? "" : "s"}
                </span>
              </div>
              <div style={{ height: 1, background: "#eceef1", margin: "16px 0 6px" }} />

              {alerts.length === 0 ? (
                <div style={{ padding: "26px 0", textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
                  No active alerts.
                </div>
              ) : alerts.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, background: TONE[a.tone].box,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <AlertTriangle size={24} color={TONE[a.tone].icon} strokeWidth={2.4} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.35 }}>{a.detail}</div>
                  </div>
                  <button
                    onClick={() => acknowledge(a.id)}
                    style={{
                      flexShrink: 0, background: "#fff", border: "1px solid #cfd2d6", borderRadius: 999,
                      padding: "9px 22px", fontSize: 15, color: "#374151", cursor: "pointer", transition: "background .12s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── MANUAL CONTROL ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{
              flex: 1, minHeight: 0, border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px 26px",
              boxShadow: "0 1px 4px rgba(16,24,40,0.06)", display: "flex", flexDirection: "column",
            }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>Manual Control</span>
              <div style={{ height: 1, background: "#eceef1", margin: "16px 0 18px" }} />

              <p style={{ fontSize: 17, color: "#374151", margin: "0 0 22px" }}>Enter Master Access to use manual mode</p>

              <label style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", marginBottom: 10 }}>User ID</label>
              <input style={{ ...FIELD, marginBottom: 22 }} placeholder="Enter user ID" />

              <label style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", marginBottom: 10 }}>Passkey</label>
              <input style={FIELD} type="password" placeholder="Enter passkey" />

              <div style={{ flex: 1 }} />

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button style={{
                  background: "#28954b", color: "#fff", fontSize: 18, fontWeight: 600,
                  border: "none", borderRadius: 8, padding: "14px 34px", cursor: "pointer", transition: "background .15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#21813f"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#28954b"; }}
                >
                  Grant Access
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
