import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, RefreshCw, Wrench, Activity } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useDashboardMetrics } from "@/lib/dashboard-store";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
});

const CARD: React.CSSProperties = {
  flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 16,
  padding: "20px 24px", boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
  display: "flex", flexDirection: "column",
};

function StatusRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 15, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: accent ?? "#1a1a1a" }}>{value}</span>
    </div>
  );
}

function MaintenancePage() {
  const m = useDashboardMetrics();
  const binsInUse = m.totalBins - m.available;
  const [note, setNote] = useState("");

  const runAction = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(""), 3500);
  };

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Maintenance Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
          System status and routine maintenance
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 16px", flexShrink: 0 }} />

        <div style={{ display: "flex", gap: 30, flex: 1, minHeight: 0, alignItems: "stretch" }}>

          {/* System status */}
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Activity size={22} color="#0a8f2e" />
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>System Status</span>
            </div>
            <div style={{ height: 1, background: "#eceef1", margin: "14px 0 4px" }} />

            <StatusRow label="PLC Connection" value="Online" accent="#0a8f2e" />
            <StatusRow label="System Uptime" value={m.uptime} />
            <StatusRow label="Active Order" value={m.activeOrder} />
            <StatusRow label="Bins In Use" value={`${binsInUse} of ${m.totalBins}`} />
            <StatusRow label="Trays" value={String(m.totalTrays)} />
            <StatusRow label="Distinct SKUs" value={String(m.skus)} />
          </div>

          {/* Maintenance actions */}
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Wrench size={20} color="#374151" />
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>Routine Maintenance</span>
            </div>
            <div style={{ height: 1, background: "#eceef1", margin: "14px 0 18px" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <button
                onClick={() => runAction("Calibration routine queued.")}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  background: "#fff", border: "1px solid #d0d4da", borderRadius: 10,
                  padding: "16px 18px", fontSize: 16, fontWeight: 600, color: "#1a1a1a",
                  cursor: "pointer", transition: "background .12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f6f8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <RefreshCw size={18} color="#0058f1" /> Run Calibration
              </button>
              <button
                onClick={() => runAction("Diagnostics started — see Troubleshoot for results.")}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  background: "#fff", border: "1px solid #d0d4da", borderRadius: 10,
                  padding: "16px 18px", fontSize: 16, fontWeight: 600, color: "#1a1a1a",
                  cursor: "pointer", transition: "background .12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f6f8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <Activity size={18} color="#0058f1" /> Run Diagnostics
              </button>
            </div>

            <div style={{ flex: 1 }} />

            {note ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginTop: 16,
                background: "#eafaf0", border: "1px solid #b6e8c8", borderRadius: 10,
                padding: "12px 16px", color: "#0a8f2e", fontSize: 14, fontWeight: 600,
              }}>
                <CheckCircle2 size={16} /> {note}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 16 }}>
                Calibration and diagnostics are routine checks. Faults surface on the Troubleshoot screen.
              </p>
            )}
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
