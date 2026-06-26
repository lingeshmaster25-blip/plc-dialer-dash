import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal, Info } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { BIN_CAPACITY } from "@/lib/inventory-store";
import { CAPACITY } from "@/lib/dashboard-store";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const CARD: React.CSSProperties = {
  flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 16,
  padding: "20px 24px", boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
  display: "flex", flexDirection: "column",
};

function ConfigRow({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 15, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
        {value}{unit ? <span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af", marginLeft: 4 }}>{unit}</span> : null}
      </span>
    </div>
  );
}

function SettingsPage() {
  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Settings
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
          System configuration
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 16px", flexShrink: 0 }} />

        <div style={{ display: "flex", gap: 30, flex: 1, minHeight: 0, alignItems: "stretch" }}>

          {/* Capacity / storage config */}
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SlidersHorizontal size={20} color="#374151" />
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>Storage & Capacity</span>
            </div>
            <div style={{ height: 1, background: "#eceef1", margin: "14px 0 4px" }} />

            <ConfigRow label="Bin capacity" value={BIN_CAPACITY} unit="units / bin" />
            <ConfigRow label="Total bins" value={CAPACITY.totalBins} />
            <ConfigRow label="Total trays" value={CAPACITY.totalTrays} />

            <div style={{ flex: 1 }} />
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16,
              background: "#f3f7ff", border: "1px solid #d3e3ff", borderRadius: 10,
              padding: "12px 16px", color: "#1d4ed8", fontSize: 13, lineHeight: 1.4,
            }}>
              <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>These values are read from the system config. Editing them in-app can be enabled with a config store.</span>
            </div>
          </div>

          {/* Application info */}
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Info size={20} color="#374151" />
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>Application</span>
            </div>
            <div style={{ height: 1, background: "#eceef1", margin: "14px 0 4px" }} />

            <ConfigRow label="System" value="Trilo Automation" />
            <ConfigRow label="Interface" value="Warehouse HMI" />
            <ConfigRow label="Data storage" value="Local (browser)" />
            <ConfigRow label="Inventory & orders" value="Persisted" />

            <div style={{ flex: 1 }} />
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 16 }}>
              Inventory and orders are saved in the browser and survive a refresh. Low-stock and stale-order
              thresholds are configured on the Troubleshoot screen.
            </p>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
