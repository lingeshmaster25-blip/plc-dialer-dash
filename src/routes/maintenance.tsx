import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { hmiApi } from "@/lib/hmi-api";

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

const MAINT_ICON = "data:image/png;base64,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";

type Tags = Record<string, boolean | number | null>;
const asBool = (v: boolean | number | null | undefined) => v === true || v === 1;
const fmtNum = (v: boolean | number | null | undefined, decimals: number) =>
  typeof v === "number" ? v.toFixed(decimals) : "--";

type Signal = { name: string; addr: string; tag: string };
type Watch = { label: string; addr: string; tag: string };

const DOOR_CMDS: Signal[] = [
  { name: "DOOR OPEN", addr: "Q0.0", tag: "Door_Open_CMD" },
  { name: "DOOR CLOSE", addr: "Q0.1", tag: "Door_Close_CMD" },
];
const AXIS_DRIVE: Signal[] = [
  { name: "Y UP", addr: "Q0.2", tag: "Y_Fwd" }, { name: "Y DOWN", addr: "Q0.3", tag: "Y_Rev" },
  { name: "X LEFT", addr: "Q0.4", tag: "X_Fwd" }, { name: "X RIGHT", addr: "Q0.5", tag: "X_Rev" },
  { name: "A FORWARD", addr: "Q0.6", tag: "A_Fwd" }, { name: "A REVERSE", addr: "Q0.7", tag: "A_Rev" },
  { name: "B FORWARD", addr: "Q1.0", tag: "B_Fwd" }, { name: "B REVERSE", addr: "Q1.1", tag: "B_Rev" },
  { name: "Z UP", addr: "Q1.2", tag: "Z_Up" }, { name: "Z DOWN", addr: "Q1.3", tag: "Z_Down" },
];
const SYSTEM: Signal[] = [
  { name: "CYCLE COMPLETE", addr: "Q1.5", tag: "Cycle_Complete" },
  { name: "FAULT ALARM", addr: "Q1.6", tag: "Fault_Alarm" },
  { name: "H RUN", addr: "M6.1", tag: "H_run" },
  { name: "OVER LOAD", addr: "M8.0", tag: "Over_load" },
  { name: "BIN OVER HEIGHT", addr: "M8.1", tag: "Bin_over_Height" },
  { name: "BIN STORE COMPLETE", addr: "M8.2", tag: "Bin_store_complete" },
];

const LIMIT_SWITCHES: Signal[] = [
  { name: "Y TOP", addr: "I0.0", tag: "Y_Top_LS" }, { name: "Y BOTTOM", addr: "I0.1", tag: "Y_Bottom_LS" },
  { name: "X LEFT", addr: "I0.2", tag: "X_Left_LS" }, { name: "X RIGHT", addr: "I0.3", tag: "X_Right_LS" },
  { name: "Z TOP", addr: "I0.4", tag: "Z_Top_LS" }, { name: "Z BOTTOM", addr: "I0.5", tag: "Z_Bottom_LS" },
  { name: "Y HOME", addr: "I0.6", tag: "Y_Home_LS" }, { name: "TRAY OUT", addr: "I0.7", tag: "Tray_Out_LS" },
  { name: "CONTROL PANEL", addr: "I1.0", tag: "Control_Panel" }, { name: "MAINTENANCE DOOR", addr: "I1.1", tag: "Maintenance_Door" },
  { name: "DOOR OPEN LS", addr: "I1.2", tag: "Door_Open_LS" }, { name: "DOOR CLOSE LS", addr: "I1.3", tag: "Door_Close_LS" },
];
const SENSOR_TRAY: Signal[] = [
  { name: "TRAY PRESENCE S1", addr: "I2.4", tag: "Tray_Pos_S1" }, { name: "TRAY PRESENCE S2", addr: "I2.5", tag: "Tray_Pos_S2" },
];
const SENSOR_AISLE: Signal[] = [
  { name: "AISLE S1", addr: "I1.4", tag: "Ext_Aisle_Area_S1" }, { name: "AISLE S2", addr: "I1.5", tag: "Ext_Aisle_Area_S2" },
  { name: "AISLE S3", addr: "I2.0", tag: "Ext_Aisle_Area_S3" }, { name: "AISLE S4", addr: "I2.1", tag: "Ext_Aisle_Area_S4" },
];
const SENSOR_FORK: Signal[] = [
  { name: "FINGER LEFT", addr: "I2.2", tag: "Finger_Left" }, { name: "FINGER RIGHT", addr: "I2.3", tag: "Finger_Right" },
  { name: "FORK LH", addr: "I2.6", tag: "Fork_LH" }, { name: "FORK RH", addr: "I2.7", tag: "Fork_RH" },
];
const SENSOR_LOADBIN: Signal[] = [
  { name: "BIN CONFIRM", addr: "I3.0", tag: "Bin_Confirm_Sensor" },
  { name: "BIN LEFT CLEAN", addr: "I3.1", tag: "Bin_spa_Left" },
  { name: "BIN RIGHT CLEAN", addr: "I3.2", tag: "Bin_spa_Right" },
  { name: "LIGHT GRID HEIGHT", addr: "I3.3", tag: "Light_Grid_BinMax" },
  { name: "LOAD CELL OVERLOAD", addr: "I3.4", tag: "Load_Cell_Overload" },
];
const SENSOR_MODE: Signal[] = [
  { name: "M RUN", addr: "M0.5", tag: "M_Run" },
];
const SENSOR_SAFETY: Signal[] = [
  { name: "EMERGENCY STOP", addr: "I3.5", tag: "Emergency_Stop" },
];

const TARGET_POS: Watch[] = [
  { label: "Y", addr: "DB4.DBD0", tag: "Y_Target" },
  { label: "X", addr: "DB4.DBD4", tag: "X_Target" },
  { label: "A", addr: "DB4.DBD8", tag: "A_Target" },
  { label: "B", addr: "DB4.DBD12", tag: "B_Target" },
  { label: "Z", addr: "DB4.DBD16", tag: "Z_Target" },
];
const ACTUAL_POS: Watch[] = [
  { label: "Y", addr: "DB4.DBD20", tag: "Y_ActualPos" },
  { label: "X", addr: "DB4.DBD24", tag: "X_ActualPos" },
  { label: "A", addr: "DB4.DBD36", tag: "A_ActualPos" },
  { label: "B", addr: "DB4.DBD28", tag: "B_ActualPos" },
  { label: "Z", addr: "DB4.DBD32", tag: "Z_ActualPos" },
];
const WATCH_VALUES: Watch[] = [
  { label: "STEP", addr: "MW100", tag: "Step" },
  { label: "CURRENT STAGE", addr: "MW12", tag: "CurrentStage" },
  { label: "SELECTED BIN", addr: "MW14", tag: "SelectedBin" },
  { label: "RACK NO", addr: "MW16", tag: "RackNo" },
  { label: "RACK BIN", addr: "MW18", tag: "RackBin" },
];

function SignalRow({ s, on }: { s: Signal; on: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: on ? "#ffffff" : "#e8eaed",
      border: on ? "1px solid #e2e4e7" : "1px solid #dfe1e4",
      borderRadius: 9, padding: "4px 13px", minWidth: 0, minHeight: 44,
    }}>
      <span style={{
        width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
        background: on ? "#1ed760" : "#b6bbc2",
        boxShadow: on ? "0 0 8px 1px rgba(30,215,96,0.6)" : "none",
      }} />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
        <span style={{ fontSize: 10.5, color: "#9ca3af", lineHeight: 1 }}>{s.addr}</span>
      </div>
      <span style={{ marginLeft: "auto", fontSize: 16, fontWeight: 600, color: on ? "#1a1a1a" : "#9ca3af" }}>
        {on ? 1 : 0}
      </span>
    </div>
  );
}

function SensorRow({ s, value, onChange }: { s: Signal; value: number; onChange: (v: string) => void }) {
  const on = value === 1;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: on ? "#ffffff" : "#e8eaed",
      border: on ? "1px solid #e2e4e7" : "1px solid #dfe1e4",
      borderRadius: 9, padding: "4px 13px", minWidth: 0, minHeight: 40,
    }}>
      <span style={{
        width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
        background: on ? "#1ed760" : "#b6bbc2",
        boxShadow: on ? "0 0 8px 1px rgba(30,215,96,0.6)" : "none",
      }} />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
        <span style={{ fontSize: 10.5, color: "#9ca3af", lineHeight: 1 }}>{s.addr}</span>
      </div>
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        style={{
          marginLeft: "auto", flexShrink: 0,
          background: "#fff", border: "1px solid #cfd2d7", borderRadius: 8,
          padding: "5px 8px", fontSize: 14, fontWeight: 600, color: "#1a1a1a",
          cursor: "pointer", outline: "none",
        }}
      >
        <option value="1">1</option>
        <option value="0">0</option>
        <option value="reset">reset</option>
      </select>
    </div>
  );
}

function WatchTile({ w, value }: { w: Watch; value: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, minHeight: 0,
      background: "#d9dce0", border: "1px solid #cdd0d5", borderRadius: 10,
      padding: "11px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.label}</span>
        <span style={{ marginLeft: "auto", flexShrink: 0, background: "#bdeec8", color: "#0a8f2e", fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 9px" }}>{w.addr}</span>
      </div>
      <span style={{ fontSize: 30, fontWeight: 600, color: "#6b7280", lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function WatchSection({ title, items, tags, decimals }: { title: string; items: Watch[]; tags: Tags; decimals: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, minHeight: 0 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", flexShrink: 0 }}>{title}</span>
      <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0 }}>
        {items.map((w) => <WatchTile key={w.tag} w={w} value={fmtNum(tags[w.tag], decimals)} />)}
      </div>
    </div>
  );
}

function IOCard({ title, children, grow }: { title: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <div style={{
      border: "1px solid #e5e7eb", borderRadius: 12, padding: "9px 14px",
      boxShadow: "0 1px 3px rgba(16,24,40,0.06)",
      display: "flex", flexDirection: "column", minHeight: 0,
      ...(grow ? { flex: 1 } : { flexShrink: 0 }),
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", letterSpacing: "0.04em", flexShrink: 0 }}>{title}</span>
      <div style={{ marginTop: 7, flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, height: "100%", gridAutoRows: "1fr" };
const col1: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr", gap: 6, height: "100%", gridAutoRows: "1fr" };
const sgrid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const scol1: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };

function MaintIllustration() {
  return (
    <img src={MAINT_ICON} alt="Maintenance" style={{ width: "78%", maxWidth: 320, height: "auto" }} />
  );
}

type AlarmDef = { label: string; addr: string; tag: string };
const ALARMS: AlarmDef[] = [
  { label: "Emergency Stop Pressed", addr: "I3.5", tag: "Emergency_Stop" },
  { label: "Fault Alarm", addr: "Q1.6", tag: "Fault_Alarm" },
  { label: "Tray Over Load", addr: "M8.0", tag: "Over_load" },
  { label: "Bin Over Height", addr: "M8.1", tag: "Bin_over_Height" },
  { label: "Tray Misalignment (Aisle)", addr: "M2.3", tag: "Tray_Misalignment" },
  { label: "Extractor Misalign / Unbalanced", addr: "M6.6", tag: "Extractor_Misalignment" },
  { label: "Y Over Travel", addr: "M4.7", tag: "Y_Over_Travel" },
  { label: "Z Over Travel", addr: "M5.0", tag: "Z_Over_Travel" },
  { label: "X Over Travel", addr: "M5.1", tag: "X_Over_Travel" },
  { label: "Control Panel Door Open", addr: "M7.1", tag: "Control_Panel_Door_Open" },
  { label: "Maintenance Store Open", addr: "M7.2", tag: "Maintenance_Store_Open" },
  { label: "Bin Pressed In Left", addr: "M7.3", tag: "Bin_Pressed_Left" },
  { label: "Bin Pressed In Right", addr: "M7.4", tag: "Bin_Pressed_Right" },
  { label: "Y Home Not Reached", addr: "M7.5", tag: "Y_Home_Not_Reached" },
  { label: "Tray Out Not Reached", addr: "M7.6", tag: "Tray_Out_Not_Reached" },
  { label: "Door Open Not Reached", addr: "M7.7", tag: "Door_Open_Not_Reached" },
  { label: "Door Close Not Reached", addr: "M8.3", tag: "Door_Close_Not_Reached" },
  { label: "Bin Not Seated Properly", addr: "M8.4", tag: "Bin_Not_Seated" },
  { label: "Tray Not Seated Properly", addr: "M8.5", tag: "Tray_Not_Seated" },
];

function AlarmRow({ a, active, live }: { a: AlarmDef; active: boolean; live: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: active ? "#fde2e2" : "#f4f5f7",
      border: active ? "1px solid #f3b4b4" : "1px solid #e5e7eb",
      borderRadius: 9, padding: "8px 14px", minWidth: 0, minHeight: 46,
    }}>
      <span style={{
        width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
        background: active ? "#db0000" : "#c2c6cc",
        boxShadow: active ? "0 0 8px 1px rgba(219,0,0,0.6)" : "none",
      }} />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.label}</span>
        <span style={{ fontSize: 10.5, color: "#9ca3af", lineHeight: 1 }}>{a.addr}</span>
      </div>
      <span style={{
        marginLeft: "auto", flexShrink: 0, fontSize: 11.5, fontWeight: 700,
        color: !live ? "#9ca3af" : active ? "#db0000" : "#0a8f2e",
      }}>
        {!live ? "--" : active ? "ACTIVE" : "OK"}
      </span>
    </div>
  );
}

function MaintenancePage() {
  const [userId, setUserId] = useState("");
  const [passkey, setPasskey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"output" | "sensor" | "live" | "limit" | "alarm">("output");
  const [tags, setTags] = useState<Tags>({});
  const [plcLive, setPlcLive] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    const poll = async () => {
      try {
        const st = await hmiApi.status();
        if (!alive) return;
        // Only surface values coming from a real, connected PLC.
        // The hmi-api simulator (used when the backend is unreachable) is ignored.
        const live = st.simulated !== true && st.connected === true;
        setPlcLive(live);
        setTags(live ? (st.tags ?? {}) : {});
      } catch {
        if (alive) { setPlcLive(false); setTags({}); }
      }
    };
    poll();
    const id = window.setInterval(poll, 700);
    return () => { alive = false; window.clearInterval(id); };
  }, [unlocked]);

  const grantAccess = () => {
    const idOk = userId.trim().toLowerCase() === MASTER_USER.toLowerCase();
    const keyOk = passkey.trim() === MASTER_KEY;
    if (idOk && keyOk) { setUnlocked(true); setError(false); }
    else setError(true);
  };

  const onSensor = (s: Signal, v: string) => {
    if (v === "reset") hmiApi.writeTag(s.tag, false);
    else hmiApi.writeTag(s.tag, v === "1");
  };

  const TabBtn = ({ id, label }: { id: "output" | "sensor" | "live" | "limit" | "alarm"; label: string }) => {
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

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Maintenance Overview
        </h1>
        <p style={{ fontSize: 13.5, color: "#6b7280", margin: "3px 0 0" }}>
          Machine vitals, calibration &amp; live PLC I/O
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0 10px", flexShrink: 0 }} />

        {!unlocked ? (
          <div style={{ display: "flex", gap: 40, flex: 1, minHeight: 0, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <MaintIllustration />
            </div>
            <div style={{ flex: 1.1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 500, color: "#1f2937", marginBottom: 22 }}>
                Enter User Credentials to use Maintenance mode
              </span>
              <label style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>User ID</label>
              <input style={CRED_FIELD} placeholder="Enter user ID" value={userId}
                onChange={(e) => { setUserId(e.target.value); setError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") grantAccess(); }} />
              <label style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", margin: "20px 0 8px" }}>Passkey</label>
              <input style={CRED_FIELD} type="password" placeholder="Enter passkey" value={passkey}
                onChange={(e) => { setPasskey(e.target.value); setError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") grantAccess(); }} />
              {error && (
                <span style={{ fontSize: 14, color: "#dc2626", fontWeight: 600, marginTop: 12 }}>
                  Invalid User ID or Passkey.
                </span>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 34 }}>
                <button onClick={grantAccess}
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
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", gap: 36, borderBottom: "1px solid #e5e7eb", flexShrink: 0, alignItems: "center" }}>
              <TabBtn id="output" label="OUTPUT STATUS" />
              <TabBtn id="sensor" label="SENSOR STATUS" />
              <TabBtn id="live" label="LIVE MONITOR" />
              <TabBtn id="limit" label="LIMIT SW" />
              <TabBtn id="alarm" label="ALARMS" />
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: plcLive ? "#0a8f2e" : "#9ca3af", paddingBottom: 9 }}>
                <span style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: plcLive ? "#1ed760" : "#c2c6cc",
                  boxShadow: plcLive ? "0 0 7px 1px rgba(30,215,96,0.6)" : "none",
                }} />
                {plcLive ? "PLC Connected" : "PLC Not Connected"}
              </span>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: 8, paddingRight: 4, display: "flex", flexDirection: "column" }}>

              {tab === "output" && (
                <div style={{ display: "flex", gap: 18, alignItems: "stretch", flex: 1, minHeight: 0 }}>
                  <div style={{ flex: 1.3, minWidth: 0, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
                    <IOCard title="DOOR COMMANDS">
                      <div style={grid2}>{DOOR_CMDS.map((s) => <SignalRow key={s.tag} s={s} on={asBool(tags[s.tag])} />)}</div>
                    </IOCard>
                    <IOCard title="AXIS DRIVE" grow>
                      <div style={grid2}>{AXIS_DRIVE.map((s) => <SignalRow key={s.tag} s={s} on={asBool(tags[s.tag])} />)}</div>
                    </IOCard>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <IOCard title="SYSTEM" grow>
                      <div style={col1}>{SYSTEM.map((s) => <SignalRow key={s.tag} s={s} on={asBool(tags[s.tag])} />)}</div>
                    </IOCard>
                  </div>
                </div>
              )}

              {tab === "sensor" && (
                <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flex: 1, minHeight: 0 }}>
                  <div style={{ flex: 1.3, minWidth: 0, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
                    <IOCard title="EXTERNAL AISLE">
                      <div style={sgrid2}>{SENSOR_AISLE.map((s) => <SensorRow key={s.tag} s={s} value={asBool(tags[s.tag]) ? 1 : 0} onChange={(v) => onSensor(s, v)} />)}</div>
                    </IOCard>
                    <IOCard title="FORK / FINGER">
                      <div style={sgrid2}>{SENSOR_FORK.map((s) => <SensorRow key={s.tag} s={s} value={asBool(tags[s.tag]) ? 1 : 0} onChange={(v) => onSensor(s, v)} />)}</div>
                    </IOCard>
                    <IOCard title="TRAY">
                      <div style={sgrid2}>{SENSOR_TRAY.map((s) => <SensorRow key={s.tag} s={s} value={asBool(tags[s.tag]) ? 1 : 0} onChange={(v) => onSensor(s, v)} />)}</div>
                    </IOCard>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
                    <IOCard title="LOAD / BIN">
                      <div style={scol1}>{SENSOR_LOADBIN.map((s) => <SensorRow key={s.tag} s={s} value={asBool(tags[s.tag]) ? 1 : 0} onChange={(v) => onSensor(s, v)} />)}</div>
                    </IOCard>
                    <IOCard title="MODE">
                      <div style={scol1}>{SENSOR_MODE.map((s) => <SensorRow key={s.tag} s={s} value={asBool(tags[s.tag]) ? 1 : 0} onChange={(v) => onSensor(s, v)} />)}</div>
                    </IOCard>
                    <IOCard title="SAFETY">
                      <div style={scol1}>{SENSOR_SAFETY.map((s) => <SensorRow key={s.tag} s={s} value={asBool(tags[s.tag]) ? 1 : 0} onChange={(v) => onSensor(s, v)} />)}</div>
                    </IOCard>
                  </div>
                </div>
              )}

              {tab === "live" && (
                <div style={{
                  flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 20,
                  border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.06)",
                }}>
                  <WatchSection title="TARGET POSITIONS" items={TARGET_POS} tags={tags} decimals={1} />
                  <WatchSection title="ACTUAL POSITIONS" items={ACTUAL_POS} tags={tags} decimals={1} />
                  <WatchSection title="WATCH VALUES" items={WATCH_VALUES} tags={tags} decimals={0} />
                </div>
              )}

              {tab === "alarm" && (
                <div style={{
                  flex: 1, minHeight: 0, overflowY: "auto",
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start",
                  border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.06)",
                }}>
                  {ALARMS.map((a) => (
                    <AlarmRow key={a.tag} a={a} active={plcLive && asBool(tags[a.tag])} live={plcLive} />
                  ))}
                </div>
              )}

              {tab === "limit" && (
                <div style={{
                  flex: 1, minHeight: 0, overflowY: "auto",
                  border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.06)",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignContent: "start" }}>
                    {LIMIT_SWITCHES.map((s) => <SensorRow key={s.tag} s={s} value={asBool(tags[s.tag]) ? 1 : 0} onChange={(v) => onSensor(s, v)} />)}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
