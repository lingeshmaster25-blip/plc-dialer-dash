import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Pencil } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useOrders, releaseToPicklist, type Priority, type Status } from "@/lib/orders-store";
import { pushActivity } from "@/lib/dashboard-store";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

const PRIORITY_STYLE: Record<Priority, { bg: string; color: string }> = {
  High:   { bg: "#facccc", color: "#d11f1f" },
  Medium: { bg: "#fff4c2", color: "#d68a06" },
  Low:    { bg: "#b0ffc8", color: "#0a8f2e" },
};

const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  Queued:    { bg: "#bcd3f5", color: "#0a5bef" },
  Released:  { bg: "#ffe4a0", color: "#b45309" },
  Picking:   { bg: "#b0ffc8", color: "#0a8f2e" },
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
const HCELL: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#4b5563", letterSpacing: "0.5px" };

function OrdersPage() {
  const navigate = useNavigate();
  const orders = useOrders();
  const [selected, setSelected] = useState(0);
  const order = orders[selected];

  const canRelease = order && (order.status === "Queued");
  const canEdit    = order && (order.status === "Queued");

  const handleRelease = () => {
    if (!order || !canRelease) return;
    releaseToPicklist(order.id);
    pushActivity("Released to Picklist", `Order ${order.id}`);
  };

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
          <button
            onClick={() => navigate({ to: "/order-new" })}
            style={{
              background: "#0058f1", color: "#fff", fontSize: 15, fontWeight: 700,
              border: "none", borderRadius: 8, padding: "11px 20px", cursor: "pointer",
              marginTop: 4, boxShadow: "0 2px 8px rgba(0,88,241,0.3)", transition: "background .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0049cc"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0058f1"; }}
          >
            + New Order
          </button>
        </div>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 14px", flexShrink: 0 }} />

        {/* Two columns */}
        <div style={{ display: "flex", gap: 28, flex: 1, minHeight: 0 }}>

          {/* ── ORDER QUEUE ── */}
          <div style={{ flex: 1.1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: "0 0 8px" }}>Order Queue</h2>

            <div style={{
              flex: 1, minHeight: 0, border: "1px solid #e5e7eb", borderRadius: 10,
              overflow: "hidden", display: "flex", flexDirection: "column",
            }}>
              {/* header */}
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
                {orders.length === 0 ? (
                  <div style={{ padding: "24px 18px", color: "#9ca3af", fontSize: 15 }}>
                    No orders yet. Create one with + New Order.
                  </div>
                ) : orders.map((o, i) => (
                  <div key={o.id}
                    onClick={() => setSelected(i)}
                    style={{
                      display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "center",
                      padding: "7px 18px", borderBottom: "1px solid #f0f1f3", cursor: "pointer",
                      background: i === selected ? "#e2e4e8" : "transparent",
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) => { if (i !== selected) e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={(e) => { if (i !== selected) e.currentTarget.style.background = "transparent"; }}
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
              {!order ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 16 }}>
                  No order selected.
                </div>
              ) : (
                <>
                  {/* card header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>Order {order.id}</span>
                    <Pill text={order.status} {...STATUS_STYLE[order.status]} />
                  </div>
                  <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                    {order.emp} · {order.priority} priority
                  </div>
                  <div style={{ height: 1, background: "#e5e7eb", margin: "16px 0 18px" }} />

                  {/* items table */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.5fr 0.6fr", marginBottom: 14 }}>
                    <span style={HCELL}>SKU</span>
                    <span style={HCELL}>ITEMS</span>
                    <span style={HCELL}>QTY</span>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                    {order.items.map((it, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.5fr 0.6fr" }}>
                        <span style={{ fontSize: 15, color: "#1f2937" }}>{it.sku}</span>
                        <span style={{ fontSize: 15, color: "#1f2937" }}>{it.item}</span>
                        <span style={{ fontSize: 15, color: "#1f2937" }}>{it.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* actions */}
                  <div style={{ display: "flex", gap: 14, marginTop: 18, flexShrink: 0 }}>
                    <button
                      onClick={handleRelease}
                      disabled={!canRelease}
                      style={{
                        flex: 1, fontSize: 15, fontWeight: 600,
                        border: "none", borderRadius: 8, padding: "13px 0", cursor: canRelease ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        background: canRelease ? "#28954a" : "#d1d5db",
                        color: canRelease ? "#fff" : "#9ca3af",
                        transition: "background .15s",
                      }}
                      onMouseEnter={(e) => { if (canRelease) e.currentTarget.style.background = "#21813f"; }}
                      onMouseLeave={(e) => { if (canRelease) e.currentTarget.style.background = "#28954a"; }}
                    >
                      <ArrowRight size={18} />
                      {order.status === "Released" ? "Already Released" :
                       order.status === "Picking"  ? "Picking in Progress" :
                       order.status === "Completed"? "Completed" :
                       "Release To Picklist"}
                    </button>
                    <button
                      disabled={!canEdit}
                      style={{
                        width: 90, fontSize: 15, fontWeight: 600,
                        border: "1px solid #d0d4da", borderRadius: 8, padding: "13px 0",
                        cursor: canEdit ? "pointer" : "not-allowed",
                        background: "#fff", color: canEdit ? "#1f2937" : "#9ca3af",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
