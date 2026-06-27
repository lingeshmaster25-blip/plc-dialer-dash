import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, RefreshCw, Wrench, Activity, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useDashboardMetrics } from "@/lib/dashboard-store";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
});

const MASTER_USER = "Trilo";
const MASTER_KEY = "trilo@2026";

const CARD: React.CSSProperties = {
  flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 16,
  padding: "20px 24px", boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
  display: "flex", flexDirection: "column",
};

const CRED_FIELD: React.CSSProperties = {
  width: "100%", background: "#e3e5e8", border: "1px solid #d7dade",
  borderRadius: 10, padding: "15px 18px", fontSize: 16, color: "#111827",
  outline: "none", boxSizing: "border-box",
};

function StatusRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 15, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: accent ?? "#1a1a1a" }}>{value}</span>
    </div>
  );
}

/** Person + wrench line illustration matching the maintenance mock. */
function MaintIllustration() {
  return (
    <svg viewBox="0 0 380 340" width="86%" style={{ maxWidth: 360 }} xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#c2c6cc" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        {/* person head */}
        <circle cx="145" cy="122" r="58" />
        {/* shoulders / bust */}
        <path d="M55 308 C55 232 98 200 145 200 C192 200 235 232 235 308" />
        {/* wrench badge */}
        <circle cx="278" cy="140" r="70" fill="#ffffff" />
      </g>
      <g transform="translate(238.5,100.5) scale(3.3)" fill="none" stroke="#c2c6cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </g>
    </svg>
  );
}

function MaintenancePage() {
  const m = useDashboardMetrics();
  const binsInUse = m.totalBins - m.available;
  const [note, setNote] = useState("");

  // ── credential gate ──
  const [userId, setUserId] = useState("");
  const [passkey, setPasskey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const grantAccess = () => {
    const idOk = userId.trim().toLowerCase() === MASTER_USER.toLowerCase();
    const keyOk = passkey.trim() === MASTER_KEY;
    if (idOk && keyOk) { setUnlocked(true); setError(false); }
    else setError(true);
  };

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
          Machine vitals, calibration &amp; live PLC I/O
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 16px", flexShrink: 0 }} />

        {!unlocked ? (
          /* ── CREDENTIAL GATE ── */
          <div style={{ display: "flex", gap: 40, flex: 1, minHeight: 0, alignItems: "center" }}>

            {/* illustration */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <MaintIllustration />
            </div>

            {/* credentials */}
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
          /* ── UNLOCKED: machine vitals + maintenance actions ── */
          <div style={{ display: "flex", gap: 30, flex: 1, minHeight: 0, alignItems: "stretch" }}>

            {/* System status */}
            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Activity size={22} color="#0a8f2e" />
                <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>System Status</span>
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#0a8f2e" }}>
                  <ShieldCheck size={15} /> Maintenance mode
                </span>
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
        )}
      </div>
    </DashboardShell>
  );
}
