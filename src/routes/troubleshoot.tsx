import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AlertTriangle, Info, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, ChevronDown } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { hmiApi } from "@/lib/hmi-api";

export const Route = createFileRoute("/troubleshoot")({
  component: TroubleshootPage,
});

const MASTER_USER = "Trilo";
const MASTER_KEY = "trilo@2026";

type Tone = "red" | "yellow" | "blue";
type Alert = { id: string; tone: Tone; title: string; detail: string };

const TONE: Record<Tone, { box: string; icon: string }> = {
  red: { box: "#fde2e2", icon: "#db0000" },
  yellow: { box: "#fff7d6", icon: "#eab308" },
  blue: { box: "#dbeeff", icon: "#2b8fff" },
};

// Sample alerts shown in maintenance/troubleshoot mode.
const INITIAL_ALERTS: Alert[] = [
  { id: "a1", tone: "red", title: "Front photocell drift", detail: "Front-left bay sensor reads 4 mm off target — fault word bit 4. Run bay calibration." },
  { id: "a2", tone: "yellow", title: "Air pressure below setpoint", detail: "Live tag DB1.AirPressure 6.1 bar vs 6.5 setpoint." },
  { id: "a3", tone: "blue", title: "Tray T-51 capacity low", detail: "3 of 24 bins free — schedule put-away." },
];

const FIELD: React.CSSProperties = {
  width: "100%", background: "#e3e5e8", border: "1px solid #d7dade",
  borderRadius: 10, padding: "15px 18px", fontSize: 16, color: "#111827",
  outline: "none", boxSizing: "border-box",
};

// Direction bits per selection (Z uses Up/Down, Door uses Open/Close).
const DIR: Record<string, { fwd: string; rev: string }> = {
  X: { fwd: "X_Fwd", rev: "X_Rev" },
  Y: { fwd: "Y_Fwd", rev: "Y_Rev" },
  Z: { fwd: "Z_Up", rev: "Z_Down" },
  A: { fwd: "A_Fwd", rev: "A_Rev" },
  B: { fwd: "B_Fwd", rev: "B_Rev" },
  Door: { fwd: "Door_Open_CMD", rev: "Door_Close_CMD" },
};
const AXIS_OPTS: { value: string; label: string }[] = [
  { value: "X", label: "X - Axis" },
  { value: "Y", label: "Y - Axis" },
  { value: "Z", label: "Z - Axis" },
  { value: "A", label: "A - Axis" },
  { value: "B", label: "B - Axis" },
  { value: "Door", label: "Door" },
];
// Per-selection jog config: which pair is active/highlighted ("v" = Lift/top-bottom,
// "h" = Move Left/Right) plus the label shown on each of the four direction buttons.
type AxisCfg = { active: "v" | "h"; up: string; down: string; left: string; right: string };
const AXIS_CFG: Record<string, AxisCfg> = {
  X:    { active: "v", up: "Lift Up",      down: "Lift Down",     left: "Move Left", right: "Move Right" },
  Y:    { active: "h", up: "Lift Up",      down: "Lift Down",     left: "Move Left", right: "Move Right" },
  Z:    { active: "h", up: "Lift Up",      down: "Lift Down",     left: "Move Left", right: "Move Right" },
  A:    { active: "h", up: "Move Forward", down: "Move Downward", left: "Move Left", right: "Move Right" },
  B:    { active: "h", up: "Move Forward", down: "Move Downward", left: "Move Left", right: "Move Right" },
  Door: { active: "h", up: "Lift Up",      down: "Lift Down",     left: "Move Left", right: "Move Right" },
};

function ControlTile({ icon, label, gray, disabled, jogTag, onTap }: { icon: React.ReactNode; label: string; gray?: boolean; disabled?: boolean; jogTag?: string; onTap?: () => void }) {
  const press = () => { if (!disabled && jogTag) hmiApi.writeTag(jogTag, true); };
  const release = () => { if (!disabled && jogTag) hmiApi.writeTag(jogTag, false); };
  return (
    <button
      onClick={disabled ? undefined : onTap}
      onMouseDown={press} onMouseUp={release} onMouseLeave={release}
      onTouchStart={press} onTouchEnd={release}
      style={{
        width: "100%", height: "100%", minHeight: 44,
        background: gray ? "#c8cace" : "#fff", border: gray ? "1px solid #b9bcc1" : "1px solid #d0d4da",
        borderRadius: 12, cursor: disabled ? "default" : "pointer", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 4, transition: "filter .12s",
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: "50%", border: "2px solid #111827",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{label}</span>
    </button>
  );
}

function TroubleshootPage() {
  const [userId, setUserId] = useState("");
  const [passkey, setPasskey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [axis, setAxis] = useState("X");
  const [actual, setActual] = useState<number | null>(null);
  const [plcLive, setPlcLive] = useState(false);

  // Live actual position for the selected axis (real PLC only).
  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    const poll = async () => {
      try {
        const st = await hmiApi.status();
        if (!alive) return;
        const live = st.simulated !== true && st.connected === true;
        setPlcLive(live);
        const v = live ? st.tags?.[`${axis}_ActualPos`] : null;
        setActual(typeof v === "number" ? v : null);
      } catch { if (alive) { setPlcLive(false); setActual(null); } }
    };
    poll();
    const id = window.setInterval(poll, 700);
    return () => { alive = false; window.clearInterval(id); };
  }, [unlocked, axis]);

  const grantAccess = () => {
    const idOk = userId.trim().toLowerCase() === MASTER_USER.toLowerCase();
    const keyOk = passkey.trim() === MASTER_KEY;
    if (idOk && keyOk) { setUnlocked(true); setError(false); }
    else setError(true);
  };

  const acknowledge = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const stopAll = () => {
    hmiApi.stop();
    for (const a of Object.keys(DIR)) { hmiApi.writeTag(DIR[a].fwd, false); hmiApi.writeTag(DIR[a].rev, false); }
  };
  const sendHome = () => {
    hmiApi.writeTag("Bin_Return_Home", true);
    window.setTimeout(() => hmiApi.writeTag("Bin_Return_Home", false), 400);
  };
  const quitManual = () => { stopAll(); setUnlocked(false); setUserId(""); setPasskey(""); };

  const cfg = AXIS_CFG[axis] ?? AXIS_CFG.X;
  const vActive = cfg.active === "v";
  const hActive = cfg.active === "h";

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Troubleshoot Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
          Active faults, alerts &amp; manual control
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 16px", flexShrink: 0 }} />

        <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 28, alignItems: "stretch" }}>

          {/* Active Alerts (always visible) */}
          <div style={{
            flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 16,
            boxShadow: "0 1px 4px rgba(16,24,40,0.06)", padding: "20px 24px",
            display: "flex", flexDirection: "column", minHeight: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
              <span style={{ fontSize: 25, fontWeight: 800, color: "#1a1a1a" }}>Active Alerts</span>
              <span style={{
                marginLeft: "auto", background: "#eef0f3", color: "#374151",
                fontSize: 13, fontWeight: 600, borderRadius: 999, padding: "5px 14px",
              }}>{alerts.length} {alerts.length === 1 ? "Alert" : "Alerts"}</span>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              {alerts.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 16, color: "#6b7280" }}>No active alerts.</span>
                </div>
              ) : alerts.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{
                    width: 44, height: 44, flexShrink: 0, borderRadius: 10,
                    background: TONE[a.tone].box, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {a.tone === "blue"
                      ? <Info size={22} color={TONE[a.tone].icon} />
                      : <AlertTriangle size={22} color={TONE[a.tone].icon} />}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{a.title}</div>
                    <div style={{ fontSize: 13.5, color: "#6b7280", marginTop: 2, lineHeight: 1.4 }}>{a.detail}</div>
                  </div>
                  <button
                    onClick={() => acknowledge(a.id)}
                    style={{
                      flexShrink: 0, background: "#fff", border: "1px solid #d0d4da", borderRadius: 999,
                      padding: "9px 20px", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f6f8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Control (login until unlocked) */}
          <div style={{
            flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 16,
            boxShadow: "0 1px 4px rgba(16,24,40,0.06)", padding: "14px 20px",
            display: "flex", flexDirection: "column", minHeight: 0,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", flexShrink: 0 }}>Manual Control</span>

            {!unlocked ? (
              /* ── ACCESS GATE inside the card ── */
              <>
                <div style={{ height: 1, background: "#e5e7eb", margin: "12px 0 0", flexShrink: 0 }} />
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 20 }}>
                  <span style={{ fontSize: 17, color: "#6b7280", marginBottom: 24 }}>Enter Master Access to use manual mode</span>

                  <label style={{ fontSize: 19, fontWeight: 700, color: "#1a1a1a", marginBottom: 9 }}>User ID</label>
                  <input style={FIELD} placeholder="Enter user ID" value={userId}
                    onChange={(e) => { setUserId(e.target.value); setError(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") grantAccess(); }} />

                  <label style={{ fontSize: 19, fontWeight: 700, color: "#1a1a1a", margin: "22px 0 9px" }}>Passkey</label>
                  <input style={FIELD} type="password" placeholder="Enter passkey" value={passkey}
                    onChange={(e) => { setPasskey(e.target.value); setError(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") grantAccess(); }} />

                  {error && (
                    <span style={{ fontSize: 14, color: "#dc2626", fontWeight: 600, marginTop: 12 }}>
                      Invalid User ID or Passkey.
                    </span>
                  )}

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", paddingTop: 18 }}>
                    <button onClick={grantAccess}
                      style={{
                        background: "#28954b", color: "#fff", fontWeight: 700, fontSize: 18,
                        border: "none", borderRadius: 10, padding: "14px 42px", cursor: "pointer",
                        boxShadow: "0 3px 10px rgba(40,149,75,0.30)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e8449"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#28954b"; }}
                    >
                      Grant Access
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ── UNLOCKED: jog controls ── */
              <>
                {/* axis + actual position */}
                <div style={{ display: "flex", alignItems: "flex-start", marginTop: 10, flexShrink: 0 }}>
                  <div style={{ position: "relative" }}>
                    <select
                      value={axis}
                      onChange={(e) => setAxis(e.target.value)}
                      style={{
                        appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                        background: "#fff", border: "1px solid #d0d4da", borderRadius: 10,
                        padding: "10px 38px 10px 16px", fontSize: 15, fontWeight: 600, color: "#1a1a1a",
                        cursor: "pointer", outline: "none",
                      }}
                    >
                      {AXIS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={18} color="#374151" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>

                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", letterSpacing: "0.03em" }}>ACTUAL POSITIONS</div>
                    <div style={{
                      marginTop: 5, minWidth: 130, background: "#e8eaed", border: "1px solid #dadce0",
                      borderRadius: 10, padding: "8px 14px", textAlign: "left",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{axis}</div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: "#6b7280", lineHeight: 1.1 }}>
                        {plcLive && actual !== null ? actual.toFixed(1) : "--"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls: Door = vertical Open/Stop/Close stack; axes = d-pad */}
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "4px 0" }}>
                  {axis === "Door" ? (
                    <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateRows: "1fr 1fr 1fr", gap: 12, maxWidth: 300, width: "100%", margin: "0 auto" }}>
                      <ControlTile icon={<ArrowUp size={18} color="#111827" />} label="Open Door" jogTag="Door_Open_CMD" />
                      <ControlTile icon={<Square size={16} color="#111827" fill="#111827" />} label="Stop" onTap={stopAll} />
                      <ControlTile icon={<ArrowDown size={18} color="#111827" />} label="Close Door" jogTag="Door_Close_CMD" />
                    </div>
                  ) : (
                    <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gap: 12, maxWidth: 520, width: "100%", margin: "0 auto" }}>
                      <div /><ControlTile gray={vActive} disabled={!vActive} icon={<ArrowUp size={18} color="#111827" />} label={cfg.up} jogTag={DIR[axis].fwd} /><div />
                      <ControlTile gray={hActive} disabled={!hActive} icon={<ArrowLeft size={18} color="#111827" />} label={cfg.left} jogTag={DIR[axis].rev} />
                      <ControlTile icon={<Square size={16} color="#111827" fill="#111827" />} label="Stop" onTap={stopAll} />
                      <ControlTile gray={hActive} disabled={!hActive} icon={<ArrowRight size={18} color="#111827" />} label={cfg.right} jogTag={DIR[axis].fwd} />
                      <div /><ControlTile gray={vActive} disabled={!vActive} icon={<ArrowDown size={18} color="#111827" />} label={cfg.down} jogTag={DIR[axis].rev} /><div />
                    </div>
                  )}
                </div>

                {/* footer */}
                <div style={{ display: "flex", gap: 16, flexShrink: 0, marginTop: 6 }}>
                  <button
                    onClick={sendHome}
                    style={{ flex: 1, background: "#fff", border: "1px solid #d0d4da", borderRadius: 10, padding: "11px 0", fontSize: 16, fontWeight: 600, color: "#1a1a1a", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f6f8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                  >
                    Send to Home
                  </button>
                  <button
                    onClick={quitManual}
                    style={{ flex: 1, background: "#db0000", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 16, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 3px 10px rgba(219,0,0,0.28)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#b00000"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#db0000"; }}
                  >
                    Quit Manual Mode
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
