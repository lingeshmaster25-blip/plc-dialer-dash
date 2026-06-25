import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { getPickingOrder } from "@/lib/orders-store";

export const Route = createFileRoute("/picklist")({
  component: PicklistPage,
});

const TILE_COLOR = {
  now: "#f6a656",
  queued: "#7dc0f7",
  picked: "#41cc17",
  empty: "#c5c5c5",
} as const;

const HCELL: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: "#9098a3", letterSpacing: "0.3px" };
const ROW_COLS = "44px 1.2fr 1.3fr 0.8fr 0.6fr";

const binNum = (b: string) => parseInt(b.replace(/\D/g, ""), 10) || 0;

function PicklistPage() {
  const order = getPickingOrder();
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const involved = new Set(order.items.map((it) => binNum(it.bin)));
  const pickedBins = new Set([...picked].map((i) => binNum(order.items[i].bin)));
  const firstUnpicked = order.items.findIndex((_, i) => !picked.has(i));
  const currentBin = firstUnpicked >= 0 ? binNum(order.items[firstUnpicked].bin) : -1;

  const tileState = (n: number): keyof typeof TILE_COLOR =>
    pickedBins.has(n) ? "picked" : n === currentBin ? "now" : involved.has(n) ? "queued" : "empty";

  const toggle = (i: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Picklist Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>Retrieve items</p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 14px", flexShrink: 0 }} />

        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", margin: "0 0 14px" }}>Order Picking</h2>

        {/* Bin tiles */}
        <div style={{
          border: "1px solid #d8dbe0", borderRadius: 12, padding: 14, flexShrink: 0,
          boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
        }}>
          <div style={{ display: "flex", gap: 14 }}>
            {Array.from({ length: 9 }).map((_, idx) => {
              const n = idx + 1;
              const state = tileState(n);
              return (
                <div key={n} style={{
                  flex: 1, height: 116, borderRadius: 12, background: TILE_COLOR[state],
                  border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
                  padding: "10px 12px", position: "relative",
                }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: "#1f2937" }}>B{n}</span>
                  {state === "picked" && (
                    <Check size={20} color="#fff" strokeWidth={3} style={{ position: "absolute", left: 10, bottom: 10 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order card */}
        <div style={{
          flex: 1, minHeight: 0, marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 14,
          padding: "18px 24px", display: "flex", flexDirection: "column",
          boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
        }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a" }}>Order {order.id}</span>
          <div style={{ height: 1, background: "#e5e7eb", margin: "12px 0 14px" }} />

          <div style={{ display: "flex", gap: 32, flex: 1, minHeight: 0 }}>

            {/* items table */}
            <div style={{ flex: 1.25, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "center", marginBottom: 6 }}>
                <span />
                <span style={HCELL}>SKU</span>
                <span style={HCELL}>ITEMS</span>
                <span style={HCELL}>BIN</span>
                <span style={HCELL}>QTY</span>
              </div>
              {order.items.map((it, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "center", padding: "9px 0" }}>
                  <div
                    onClick={() => toggle(i)}
                    style={{
                      width: 26, height: 26, borderRadius: 6, cursor: "pointer",
                      border: "1.5px solid #c2c6cc",
                      background: picked.has(i) ? "#41cc17" : "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {picked.has(i) && <Check size={17} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 17, color: "#1f2937" }}>{it.sku}</span>
                  <span style={{ fontSize: 17, color: "#1f2937" }}>{it.item}</span>
                  <span style={{ fontSize: 17, color: "#1f2937" }}>{it.bin}</span>
                  <span style={{ fontSize: 17, color: "#1f2937" }}>{it.qty}</span>
                </div>
              ))}
            </div>

            {/* legend + actions */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { c: TILE_COLOR.now, label: "Pick now" },
                  { c: TILE_COLOR.queued, label: "Queued" },
                  { c: TILE_COLOR.picked, label: "Picked" },
                ].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 50, height: 30, borderRadius: 6, background: l.c, border: "1px solid rgba(0,0,0,0.08)" }} />
                    <span style={{ fontSize: 17, color: "#1f2937" }}>- &nbsp;{l.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1 }} />

              <button style={{
                background: "#0058f1", color: "#fff", fontSize: 16, fontWeight: 600,
                border: "none", borderRadius: 8, padding: "14px 0", cursor: "pointer",
                marginBottom: 14, transition: "background .15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#0049cc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#0058f1"; }}
              >
                Retrieve Next Tray
              </button>

              <div style={{ display: "flex", gap: 14 }}>
                <button style={{
                  flex: 1, background: "#1e8449", color: "#fff", fontSize: 16, fontWeight: 600,
                  border: "none", borderRadius: 8, padding: "14px 0", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background .15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#196e3c"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#1e8449"; }}
                >
                  <Check size={18} strokeWidth={3} /> Confirm Pick
                </button>
                <button style={{
                  width: 140, background: "#fff", color: "#1f2937", fontSize: 16, fontWeight: 600,
                  border: "1px solid #d0d4da", borderRadius: 8, padding: "14px 0", cursor: "pointer",
                }}>
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
