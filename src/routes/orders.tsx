import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

type Priority = "High" | "Medium" | "Low";
type Status = "Picking" | "Queued" | "Completed";
type Order = {
  id: string;
  emp: string;
  priority: Priority;
  status: Status;
  items: { sku: string; item: string; qty: number }[];
};

const AUTO = [{ sku: "SKU-007", item: "Automotive Part", qty: 24 }, { sku: "SKU-053", item: "Screws", qty: 10 }];

const ORDERS: Order[] = [
  { id: "#534", emp: "Deepak", priority: "High", status: "Picking", items: AUTO },
  { id: "#532", emp: "Mohan", priority: "High", status: "Queued", items: AUTO },
  { id: "#530", emp: "Guru", priority: "Medium", status: "Queued", items: [{ sku: "SKU-012", item: "Bolts", qty: 50 }, { sku: "SKU-031", item: "Washers", qty: 120 }] },
  { id: "#528", emp: "Deepak", priority: "Medium", status: "Completed", items: [{ sku: "SKU-101", item: "Brake Pads", qty: 8 }] },
  { id: "#526", emp: "Mohan", priority: "Low", status: "Queued", items: [{ sku: "SKU-204", item: "Filters", qty: 16 }] },
  { id: "#524", emp: "Guru", priority: "Low", status: "Completed", items: [{ sku: "SKU-077", item: "Gaskets", qty: 30 }] },
  { id: "#534", emp: "Deepak", priority: "Medium", status: "Picking", items: AUTO },
  { id: "#532", emp: "Mohan", priority: "High", status: "Queued", items: [{ sku: "SKU-019", item: "Bearings", qty: 12 }] },
  { id: "#530", emp: "Guru", priority: "Medium", status: "Queued", items: [{ sku: "SKU-088", item: "Seals", qty: 40 }] },
  { id: "#528", emp: "Deepak", priority: "Low", status: "Completed", items: [{ sku: "SKU-101", item: "Brake Pads", qty: 8 }] },
  { id: "#526", emp: "Mohan", priority: "High", status: "Queued", items: [{ sku: "SKU-204", item: "Filters", qty: 16 }] },
];

const PRIORITY_STYLE: Record<Priority, { bg: string; color: string }> = {
  High: { bg: "#facccc", color: "#d11f1f" },
  Medium: { bg: "#fff4c2", color: "#d68a06" },
  Low: { bg: "#b0ffc8", color: "#0a8f2e" },
};

const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  Picking: { bg: "#b0ffc8", color: "#0a8f2e" },
  Queued: { bg: "#bcd3f5", color: "#0a5bef" },
  Completed: { bg: "#0a9d30", color: "#ffffff" },
};

function Pill({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{
      background: bg, color, padding: "4px 14px", borderRadius: 999,
      fontSize: 13, fontWeight: 600, display: "inline-block", whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

const ROW_COLS = "0.85fr 1.5fr 1fr 1fr";

function OrdersPage() {
  const [selected, setSelected] = useState(1);
  const order = ORDERS[selected];

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
              Orders Overview
            </h1>
            <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
              Manage and release picking orders
            </p>
          </div>
          <button style={{
            background: "#0058f1", color: "#fff", fontSize: 15, fontWeight: 700,
            border: "none", borderRadius: 8, padding: "11px 20px", cursor: "pointer",
            marginTop: 4, boxShadow: "0 2px 8px rgba(0,88,241,0.3)", transition: "background .15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0049cc"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0058f1"; }}
          >
            +New Order
          </button>
        </div>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 14px", flexShrink: 0 }} />

        {/* Two columns: queue table | order detail */}
        <div style={{ display: "flex", gap: 28, flex: 1, minHeight: 0 }}>

          {/* ── ORDER QUEUE ── */}
          <div style={{ flex: 1.1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: "0 0 8px" }}>Order Queue</h2>

            <div style={{
              flex: 1, minHeight: 0, border: "1px solid #e5e7eb", borderRadius: 10,
              overflow: "hidden", display: "flex", flexDirection: "column",
            }}>
              {/* table header */}
              <div style={{
                display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "center",
                padding: "9px 18px", borderBottom: "1px solid #e5e7eb", flexShrink: 0,
              }}>
                <span style={HCELL}>ORDER</span>
                <span style={HCELL}>EMPLOYEE NAME</span>
                <span style={{ ...HCELL, textAlign: "center" }}>PRIORITY</span>
                <span style={{ ...HCELL, textAlign: "center" }}>STATUS</span>
              </div>

              {/* rows */}
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {ORDERS.map((o, i) => (
                  <div key={i}
                    onClick={() => setSelected(i)}
                    style={{
                      display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "center",
                      padding: "7px 18px", borderBottom: "1px solid #f0f1f3", cursor: "pointer",
                      background: i === selected ? "#e2e4e8" : "transparent",
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{o.id}</span>
                    <span style={{ fontSize: 15, color: "#1f2937" }}>{o.emp}</span>
                    <span style={{ textAlign: "center" }}>
                      <Pill text={o.priority} {...PRIORITY_STYLE[o.priority]} />
                    </span>
                    <span style={{ textAlign: "center" }}>
                      <Pill text={o.status} {...STATUS_STYLE[o.status]} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── ORDER DETAIL ── */}
          <div style={{ flex: 0.95, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{
              flex: 1, minHeight: 0, border: "1px solid #e5e7eb", borderRadius: 14,
              padding: "22px 26px", display: "flex", flexDirection: "column",
              boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
            }}>
              {/* card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>Order {order.id}</span>
                <Pill text={order.status} {...STATUS_STYLE[order.status]} />
              </div>
              <div style={{ height: 1, background: "#e5e7eb", margin: "16px 0 18px" }} />

              {/* items table */}
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.5fr 0.6fr", marginBottom: 14 }}>
                <span style={HCELL}>SKU</span>
                <span style={HCELL}>ITEMS</span>
                <span style={HCELL}>QTY</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {order.items.map((it, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.5fr 0.6fr" }}>
                    <span style={{ fontSize: 16, color: "#1f2937" }}>{it.sku}</span>
                    <span style={{ fontSize: 16, color: "#1f2937" }}>{it.item}</span>
                    <span style={{ fontSize: 16, color: "#1f2937" }}>{it.qty}</span>
                  </div>
                ))}
              </div>

              {/* spacer */}
              <div style={{ flex: 1 }} />

              {/* actions */}
              <div style={{ display: "flex", gap: 14 }}>
                <button style={{
                  flex: 1, background: "#28954a", color: "#fff", fontSize: 16, fontWeight: 600,
                  border: "none", borderRadius: 8, padding: "13px 0", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background .15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#21813f"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#28954a"; }}
                >
                  <ArrowRight size={18} /> Release To Picklist
                </button>
                <button style={{
                  width: 150, background: "#fff", color: "#1f2937", fontSize: 16, fontWeight: 600,
                  border: "1px solid #d0d4da", borderRadius: 8, padding: "13px 0", cursor: "pointer",
                }}>
                  Edit
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}

const HCELL: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: "#4b5563", letterSpacing: "0.5px",
};
