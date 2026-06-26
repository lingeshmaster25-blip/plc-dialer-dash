import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SlidersHorizontal, Bell, Save, RotateCcw, Check } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useConfig, setConfig, resetConfig, DEFAULT_CONFIG, type AppConfig } from "@/lib/config-store";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const CARD: React.CSSProperties = {
  flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 16,
  padding: "20px 24px", boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
  display: "flex", flexDirection: "column",
};

const NUMFIELD: React.CSSProperties = {
  width: 120, background: "#e6e7ea", border: "1px solid #dadbdf",
  borderRadius: 8, padding: "10px 12px", fontSize: 15, color: "#111827",
  outline: "none", boxSizing: "border-box", textAlign: "right",
};

function Row({ label, hint, value, unit, onChange }: {
  label: string; hint?: string; value: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f3f4f6", gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, color: "#1f2937", fontWeight: 600 }}>{label}</div>
        {hint ? <div style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 2 }}>{hint}</div> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <input
          style={NUMFIELD}
          type="number"
          min={0}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        />
        {unit ? <span style={{ fontSize: 13, color: "#9ca3af", width: 64 }}>{unit}</span> : <span style={{ width: 64 }} />}
      </div>
    </div>
  );
}

function SettingsPage() {
  const saved = useConfig();
  const [draft, setDraft] = useState<AppConfig>(saved);
  const [justSaved, setJustSaved] = useState(false);

  // Keep the draft in sync if config changes elsewhere.
  useEffect(() => { setDraft(saved); }, [saved]);

  const dirty = (Object.keys(draft) as (keyof AppConfig)[]).some((k) => draft[k] !== saved[k]);
  const set = (patch: Partial<AppConfig>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    setConfig(draft);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2500);
  };

  const reset = () => {
    resetConfig();
    setDraft({ ...DEFAULT_CONFIG });
  };

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
              Settings
            </h1>
            <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>System configuration</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
            {justSaved && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0a8f2e", fontSize: 14, fontWeight: 600 }}>
                <Check size={16} /> Saved
              </span>
            )}
            <button
              onClick={reset}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: "#374151",
                fontSize: 14, fontWeight: 600, border: "1px solid #d0d4da", borderRadius: 8,
                padding: "10px 16px", cursor: "pointer",
              }}
            >
              <RotateCcw size={15} /> Reset
            </button>
            <button
              onClick={save}
              disabled={!dirty}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700,
                border: "none", borderRadius: 8, padding: "10px 20px",
                cursor: dirty ? "pointer" : "not-allowed",
                background: dirty ? "#0058f1" : "#cbd5e1", color: "#fff",
                boxShadow: dirty ? "0 2px 8px rgba(0,88,241,0.3)" : "none", transition: "background .15s",
              }}
            >
              <Save size={15} /> Save Changes
            </button>
          </div>
        </div>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 16px", flexShrink: 0 }} />

        <div style={{ display: "flex", gap: 30, flex: 1, minHeight: 0, alignItems: "stretch" }}>

          {/* Storage & capacity */}
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SlidersHorizontal size={20} color="#374151" />
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>Storage & Capacity</span>
            </div>
            <div style={{ height: 1, background: "#eceef1", margin: "14px 0 4px" }} />

            <Row label="Bin capacity" hint="Max units per bin before over-capacity warning"
              value={draft.binCapacity} unit="units / bin" onChange={(v) => set({ binCapacity: v })} />
            <Row label="Total bins" hint="Physical bins in the module"
              value={draft.totalBins} unit="bins" onChange={(v) => set({ totalBins: v })} />
            <Row label="Total trays" hint="Physical trays in the module"
              value={draft.totalTrays} unit="trays" onChange={(v) => set({ totalTrays: v })} />

            <div style={{ flex: 1 }} />
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 16 }}>
              Bin and tray counts drive the dashboard Inventory Overview. Bin capacity drives the putaway
              warning and the over-capacity alert.
            </p>
          </div>

          {/* Alerts & thresholds */}
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bell size={20} color="#374151" />
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>Alerts & Thresholds</span>
            </div>
            <div style={{ height: 1, background: "#eceef1", margin: "14px 0 4px" }} />

            <Row label="Low-stock threshold" hint="SKU total below this shows on the notification bell"
              value={draft.lowStockThreshold} unit="units" onChange={(v) => set({ lowStockThreshold: v })} />
            <Row label="Stale order time" hint="Queued longer than this alerts on Troubleshoot"
              value={draft.staleOrderMins} unit="minutes" onChange={(v) => set({ staleOrderMins: v })} />

            <div style={{ flex: 1 }} />
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 16 }}>
              Changes apply across the app as soon as you save — putaway, search, the bell, and Troubleshoot
              all read these live. Inventory and orders are stored in your browser.
            </p>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
