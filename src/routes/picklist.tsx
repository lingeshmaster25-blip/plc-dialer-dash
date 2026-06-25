import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/picklist")({
  component: PicklistPage,
});

// ── Static order data ────────────────────────────────────────────────────────
const ORDER = {
  id: "532",
  items: [
    { sku: "SKU-007", name: "Automotive Part", qty: 24, checked: true },
    { sku: "SKU-053", name: "Screws",          qty: 10, checked: false },
  ],
};

// 4 rows × 6 cols of bins. Green = picked, Yellow = current, Gray = pending.
// Row 0, Col 1 = green; Row 1, Col 1–2 = yellow; rest = gray
type BinState = "green" | "yellow" | "gray";

const INITIAL_BINS: BinState[][] = Array.from({ length: 4 }, (_, r) =>
  Array.from({ length: 6 }, (_, c) => {
    if (r === 0 && c === 1) return "green";
    if (r === 1 && c === 1) return "yellow";
    if (r === 1 && c === 2) return "yellow";
    return "gray";
  })
);

const BIN_COLOR: Record<BinState, string> = {
  green:  "#4caf50",
  yellow: "#f5c842",
  gray:   "#c5c5c5",
};

function PicklistPage() {
  const [bins] = useState<BinState[][]>(INITIAL_BINS);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    ORDER.items.map((i) => i.checked)
  );

  const toggleCheck = (idx: number) =>
    setCheckedItems((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  return (
    <DashboardShell>
      <div style={{
        flex: 1, minWidth: 0, overflow: "hidden",
        padding: "18px 24px", display: "flex", flexDirection: "column",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}>

        {/* ── Header ── */}
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Picklist Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
          Retrieve items
        </p>

        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 12px", flexShrink: 0 }} />

        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", margin: "0 0 12px" }}>
          Order Picking
        </h2>

        {/* ── Body: bin grid + order panel ── */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 20 }}>

          {/* Bin Grid */}
          <div style={{
            flex: 1, minWidth: 0, minHeight: 0,
            border: "1px solid #d0d4da", borderRadius: 12,
            background: "#f8f8f8",
            padding: 16,
            display: "grid",
            gridTemplateRows: "repeat(4, 1fr)",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 12,
          }}>
            {bins.map((row, r) =>
              row.map((state, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    background: BIN_COLOR[state],
                    borderRadius: 8,
                    display: "flex", alignItems: "flex-start", justifyContent: "flex-start",
                    padding: "10px 12px",
                    minHeight: 0,
                    transition: "background .2s",
                    cursor: "default",
                    boxShadow: state !== "gray" ? "0 2px 8px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: state === "gray" ? "#555" : "#1a1a1a",
                  }}>
                    B1
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Order Panel */}
          <div style={{
            width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0,
            border: "1px solid #d0d4da", borderRadius: 12, background: "#fff",
            overflow: "hidden",
          }}>

            {/* Order title */}
            <div style={{ padding: "16px 18px 10px", borderBottom: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
                Order #{ORDER.id}
              </span>
            </div>

            {/* SKU table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1.6fr 0.7fr",
              padding: "8px 18px",
              borderBottom: "1px solid #e5e7eb",
            }}>
              {["SKU", "ITEMS", "QTY"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9098a3", letterSpacing: "0.7px" }}>
                  {h}
                </span>
              ))}
            </div>

            {/* SKU rows */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {ORDER.items.map((item, idx) => (
                <div
                  key={item.sku}
                  onClick={() => toggleCheck(idx)}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 1.6fr 0.7fr",
                    alignItems: "center",
                    padding: "10px 18px",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    background: checkedItems[idx] ? "#f0fff4" : "#fff",
                    transition: "background .12s",
                  }}
                >
                  {/* Checkbox + SKU */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                      border: checkedItems[idx] ? "none" : "1.5px solid #c0c4cc",
                      background: checkedItems[idx] ? "#22c55e" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {checkedItems[idx] && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{item.sku}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#374151" }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{item.qty}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #e5e7eb" }}>
              {/* Retrieve Next Tray */}
              <button style={{
                background: "#1068ff", color: "#fff",
                border: "none", borderRadius: 8,
                padding: "12px 0", fontSize: 14, fontWeight: 600,
                cursor: "pointer", width: "100%",
                transition: "background .15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#0049cc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#1068ff"; }}
              >
                Retrieve Next Tray
              </button>

              {/* Confirm Pick + Find */}
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{
                  flex: 1, background: "#28954b", color: "#fff",
                  border: "none", borderRadius: 8,
                  padding: "11px 0", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 5,
                  transition: "background .15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#21813f"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#28954b"; }}
                >
                  <Check size={14} strokeWidth={2.5} />
                  Confirm Pick
                </button>
                <button style={{
                  flex: 1, background: "#fff", color: "#1a1a1a",
                  border: "1.5px solid #d0d4da", borderRadius: 8,
                  padding: "11px 0", fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  transition: "background .15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                >
                  Find
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
