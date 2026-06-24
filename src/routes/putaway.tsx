import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/putaway")({
  component: PutawayPage,
});

const LABEL: React.CSSProperties = {
  display: "block", fontSize: 17, fontWeight: 700,
  color: "#111827", marginBottom: 10,
};

const FIELD: React.CSSProperties = {
  width: "100%", background: "#e8eaec", border: "1px solid #e2e4e7",
  borderRadius: 8, padding: "14px 16px", fontSize: 16, color: "#111827",
  outline: "none", boxSizing: "border-box",
};

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "15px 16px", fontSize: 18, fontWeight: 500,
        borderRadius: 8, cursor: "pointer",
        background: active ? "#eafaf0" : "#fff",
        border: active ? "1.5px solid #15803d" : "1px solid #d0d4da",
        color: active ? "#15803d" : "#111827",
        transition: "all .12s",
      }}
    >
      {label}
    </button>
  );
}

function PutawayPage() {
  const [storingType, setStoringType] = useState<"Tray" | "Bin" | null>(null);
  const [partition, setPartition] = useState<"Single" | "Multi" | null>(null);
  const [qty, setQty] = useState<number>(0);

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: "30px 40px" }}>

        {/* Header */}
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Putaway Overview
        </h1>
        <p style={{ fontSize: 18, color: "#6b7280", margin: "6px 0 0" }}>
          Store Items into the module
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "20px 0 26px" }} />

        {/* Two columns: form | preview */}
        <div style={{ display: "flex", gap: 36, alignItems: "stretch" }}>

          {/* ── FORM ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 22 }}>

            {/* SKUs + Quantity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <label style={LABEL}>SKUs</label>
                <input style={FIELD} placeholder="Enter SKU or Scan SKU" />
              </div>
              <div>
                <label style={LABEL}>Quantity</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={FIELD}
                    type="number"
                    placeholder="Qty"
                    value={qty === 0 ? "" : qty}
                    onChange={(e) => setQty(Number(e.target.value) || 0)}
                  />
                  <div style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    display: "flex", flexDirection: "column",
                  }}>
                    <ChevronUp size={16} color="#374151" style={{ cursor: "pointer" }}
                      onClick={() => setQty((q) => q + 1)} />
                    <ChevronDown size={16} color="#374151" style={{ cursor: "pointer" }}
                      onClick={() => setQty((q) => Math.max(0, q - 1))} />
                  </div>
                </div>
              </div>
            </div>

            {/* SKU Description */}
            <div>
              <label style={LABEL}>SKU Description</label>
              <input style={FIELD} placeholder="Enter SKU description" />
            </div>

            {/* Choose Storing Type */}
            <div>
              <label style={LABEL}>Choose Storing Type</label>
              <div style={{ display: "flex", gap: 24 }}>
                <Toggle label="Tray" active={storingType === "Tray"} onClick={() => setStoringType("Tray")} />
                <Toggle label="Bin" active={storingType === "Bin"} onClick={() => setStoringType("Bin")} />
              </div>
            </div>

            {/* Partition Type */}
            <div>
              <label style={LABEL}>Partition Type</label>
              <div style={{ display: "flex", gap: 24 }}>
                <Toggle label="Single" active={partition === "Single"} onClick={() => setPartition("Single")} />
                <Toggle label="Multi" active={partition === "Multi"} onClick={() => setPartition("Multi")} />
              </div>
            </div>

            {/* BIN ID + TRAY ID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <label style={LABEL}>BIN ID</label>
                <input style={FIELD} placeholder="Enter or Scan BIN ID" />
              </div>
              <div>
                <label style={LABEL}>TRAY ID</label>
                <input style={FIELD} placeholder="Enter or Scan TRAY ID" />
              </div>
            </div>

            {/* KEEP */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
              <button style={{
                background: "#15803d", color: "#fff", fontWeight: 700, fontSize: 19,
                letterSpacing: "1px", border: "none", borderRadius: 8,
                padding: "16px 0", width: 300, cursor: "pointer",
                boxShadow: "0 2px 6px rgba(21,128,61,0.3)", transition: "background .15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#13702f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#15803d"; }}
              >
                KEEP
              </button>
            </div>
          </div>

          {/* ── STORAGE PREVIEW ── */}
          <div style={{
            flex: 1, minWidth: 0, border: "1px solid #d0d4da", borderRadius: 10,
            padding: "22px 26px", display: "flex", flexDirection: "column",
          }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>Storage Preview</span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 360 }}>
              <span style={{ fontSize: 30, color: "#6b7280" }}>No Preview Selected</span>
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
