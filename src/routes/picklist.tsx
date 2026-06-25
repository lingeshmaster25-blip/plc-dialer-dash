import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/picklist")({
  component: PicklistPage,
});

const ORDER = {
  id: "532",
  items: [
    { sku: "SKU-007", name: "Automotive Part", qty: 24, checked: true },
    { sku: "SKU-053", name: "Screws",          qty: 10, checked: false },
  ],
};

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
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        padding: "20px 22px 16px 22px",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter','Segoe UI',sans-serif",
        boxSizing: "border-box",
      }}>

        {/* Page heading */}
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
          Picklist Overview
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "2px 0 0", lineHeight: 1 }}>
          Retrieve items
        </p>

        {/* Section heading */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: "12px 0 8px", lineHeight: 1 }}>
          Order Picking
        </h2>

        {/* ONE shared card containing both bin grid and order panel */}
        <div style={{
          flex: 1,
          minHeight: 0,
          border: "1px solid #d0d4da",
          borderRadius: 10,
          background: "#fff",
          display: "flex",
          overflow: "hidden",
        }}>

          {/* Bin Grid — fills left, no own border */}
          <div style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            padding: "14px",
            display: "grid",
            gridTemplateRows: "repeat(4, 1fr)",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 10,
            boxSizing: "border-box",
          }}>
            {bins.map((row, r) =>
              row.map((state, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    background: BIN_COLOR[state],
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    padding: "8px 10px",
                    minHeight: 0,
                    boxShadow: state !== "gray" ? "0 2px 6px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: state === "gray" ? "#555" : "#1a1a1a",
                  }}>
                    B1
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: "#e5e7eb", flexShrink: 0 }} />

          {/* Order Panel — fixed width, right side of the same card */}
          <div style={{
            width: 230,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxSizing: "border-box",
          }}>

            {/* Order title */}
            <div style={{ padding: "14px 16px 10px", flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
                Order #{ORDER.id}
              </span>
            </div>

            {/* Column headers */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 36px",
              padding: "5px 16px",
              borderTop: "1px solid #e5e7eb",
              borderBottom: "1px solid #e5e7eb",
              flexShrink: 0,
            }}>
              {["SKU", "ITEMS", "QTY"].map((h) => (
                <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "#9098a3", letterSpacing: "0.6px" }}>
                  {h}
                </span>
              ))}
            </div>

            {/* SKU rows */}
            <div style={{ overflowY: "auto", flexShrink: 0 }}>
              {ORDER.items.map((item, idx) => (
                <div
                  key={item.sku}
                  onClick={() => toggleCheck(idx)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 36px",
                    alignItems: "center",
                    padding: "10px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    background: checkedItems[idx] ? "#f0fff4" : "#fff",
                    transition: "background .12s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 15,
                      height: 15,
                      borderRadius: 3,
                      flexShrink: 0,
                      border: checkedItems[idx] ? "none" : "1.5px solid #c0c4cc",
                      background: checkedItems[idx] ? "#22c55e" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {checkedItems[idx] && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "#1a1a1a" }}>{item.sku}</span>
                  </div>
                  <span style={{ fontSize: 11.5, color: "#374151" }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{item.qty}</span>
                </div>
              ))}
            </div>

            {/* Push buttons to bottom */}
            <div style={{ flex: 1 }} />

            {/* Action buttons */}
            <div style={{
              padding: "10px 12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              borderTop: "1px solid #e5e7eb",
              flexShrink: 0,
            }}>
              <button
                style={{
                  background: "#1068ff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "12px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#0049cc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#1068ff"; }}
              >
                Retrieve Next Tray
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    flex: 1,
                    background: "#28954b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    padding: "10px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#21813f"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#28954b"; }}
                >
                  <Check size={13} strokeWidth={2.5} />
                  Confirm Pick
                </button>
                <button
                  style={{
                    flex: 1,
                    background: "#fff",
                    color: "#1a1a1a",
                    border: "1.5px solid #d0d4da",
                    borderRadius: 7,
                    padding: "10px 0",
                    fontSize: 12,
                    fontWeight: 600,
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
