import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronUp, ChevronDown, Plus, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { lookupBySku, usePutawayRecords } from "@/lib/inventory-store";
import { addOrder, useOrders, type Priority } from "@/lib/orders-store";
import { pushActivity } from "@/lib/dashboard-store";

export const Route = createFileRoute("/order-new")({
  component: OrderNewPage,
});

const FIELD: React.CSSProperties = {
  width: "100%", background: "#e6e7ea", border: "1px solid #dadbdf",
  borderRadius: 8, padding: "12px 16px", fontSize: 15, color: "#111827",
  outline: "none", boxSizing: "border-box",
};
const SECTION: React.CSSProperties = {
  display: "block", fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 8,
};
const BOX: React.CSSProperties = {
  flex: 1, minHeight: 0, border: "1px solid #d0d4da", borderRadius: 10, background: "#fff",
  boxShadow: "inset 0 2px 8px rgba(16,24,40,0.14)",
};
const VLABEL: React.CSSProperties = { fontSize: 15, color: "#9098a3", fontWeight: 400, marginBottom: 3 };
const VVALUE: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 };
const VSUB: React.CSSProperties = { fontSize: 14, color: "#6b7280", marginTop: 3 };

function Field({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={VLABEL}>{label}</div>
      <div style={VVALUE}>{value}</div>
      {sub ? <div style={VSUB}>{sub}</div> : null}
    </div>
  );
}

type ItemRow = { sku: string; desc: string; qty: number };
const emptyRow = (): ItemRow => ({ sku: "", desc: "", qty: 0 });

function QtyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        style={FIELD} type="number" placeholder="Qty"
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column" }}>
        <ChevronUp size={15} color="#374151" style={{ cursor: "pointer" }} onClick={() => onChange(value + 1)} />
        <ChevronDown size={15} color="#374151" style={{ cursor: "pointer" }} onClick={() => onChange(Math.max(0, value - 1))} />
      </div>
    </div>
  );
}

function OrderNewPage() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [items, setItems] = useState<ItemRow[]>([emptyRow()]);
  const [modal, setModal] = useState<null | { kind: "success"; id: string } | { kind: "error"; msg: string }>(null);

  usePutawayRecords();
  const orders = useOrders();

  // Use last 6 completed/queued orders as "Recent Orders"
  const recentOrders = orders.slice(0, 6);

  const updateItem = (idx: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));

  const addRow = () => setItems((prev) => [...prev, emptyRow()]);
  const removeRow = (idx: number) =>
    setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  // Resolve availability for the first SKU row (for preview)
  const firstSku = items[0]?.sku ?? "";
  const avail = lookupBySku(firstSku);

  const validItems = items.filter((r) => r.sku.trim() && r.qty > 0);
  const previewReady = validItems.length > 0 && employee.trim() !== "" && priority !== "";

  const handleConfirm = () => {
    if (!previewReady) {
      const msg = !employee.trim()
        ? "Please enter an employee name."
        : !priority
        ? "Please select a priority."
        : "Please add at least one item with a SKU and qty.";
      setModal({ kind: "error", msg });
      return;
    }
    const orderItems = validItems.map((r) => {
      const info = lookupBySku(r.sku);
      return {
        sku: r.sku.trim().toUpperCase(),
        item: r.desc.trim() || info?.description || r.sku,
        bin: info?.bin ?? "—",
        qty: r.qty,
      };
    });
    const id = addOrder(employee.trim(), priority as Priority, orderItems);
    pushActivity("Order Created", `${id} by ${employee.trim()}`);
    setModal({ kind: "success", id });
  };

  const handleOkay = () => {
    if (modal?.kind === "success") {
      setEmployee("");
      setPriority("");
      setItems([emptyRow()]);
    }
    setModal(null);
  };

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Header */}
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Orders Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
          Manage and release picking orders
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 14px", flexShrink: 0 }} />
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", margin: "0 0 14px" }}>Order Picking</h2>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* TOP: form + item availability */}
          <div style={{ display: "flex", gap: 28, alignItems: "stretch", flex: 0.92, minHeight: 0 }}>

            {/* form */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={SECTION}>Order Created by</label>
                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
                  <input style={FIELD} placeholder="Enter Employee Name"
                    value={employee} onChange={(e) => setEmployee(e.target.value)} />
                  <div style={{ position: "relative" }}>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "")}
                      style={{ ...FIELD, appearance: "none", cursor: "pointer", color: priority ? "#111827" : "#9ca3af" }}>
                      <option value="" disabled>Select Priority</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                    <ChevronDown size={16} color="#374151" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={SECTION}>Enter Order Details</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((row, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 0.7fr 36px", gap: 12, alignItems: "center" }}>
                      <input style={FIELD} placeholder="*SKU Code"
                        value={row.sku} onChange={(e) => updateItem(idx, { sku: e.target.value })} />
                      <input style={FIELD} placeholder="Description"
                        value={row.desc} onChange={(e) => updateItem(idx, { desc: e.target.value })} />
                      <QtyInput value={row.qty} onChange={(v) => updateItem(idx, { qty: v })} />
                      {items.length > 1 ? (
                        <button onClick={() => removeRow(idx)} style={{
                          background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <X size={16} />
                        </button>
                      ) : <div />}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  onClick={addRow}
                  style={{ color: "#1068ff", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Plus size={16} /> Add Items
                </span>
              </div>
            </div>

            {/* item availability */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <label style={{ ...SECTION, fontWeight: 500, fontSize: 20 }}>Item Availability</label>
              <div style={BOX}>
                {avail ? (
                  <div style={{ padding: "20px 24px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.8fr", gap: 16 }}>
                      <Field label="Bin" value={avail.bin} />
                      <Field label="Tray" value={avail.tray} />
                      <Field label="Qty" value={avail.available} />
                    </div>
                    <Field label="SKU" value={firstSku} sub={items[0].desc || avail.description} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* BOTTOM: recent orders + preview + confirm */}
          <div style={{ display: "flex", gap: 24, flex: 1, minHeight: 0, alignItems: "stretch" }}>

            {/* recent orders */}
            <div style={{ flex: 0.92, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <label style={{ ...SECTION, fontWeight: 700, fontSize: 22 }}>Recent Orders</label>
              <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignContent: "start" }}>
                {recentOrders.length === 0 ? (
                  <span style={{ fontSize: 15, color: "#9ca3af", gridColumn: "1/-1" }}>No orders yet.</span>
                ) : recentOrders.map((o) => (
                  <button key={o.id}
                    onClick={() => navigate({ to: "/orders" })}
                    style={{
                      background: "#fff", border: "1px solid #d0d4da", borderRadius: 8,
                      fontSize: 15, fontWeight: 500, color: "#1a1a1a", cursor: "pointer",
                      padding: "10px 0", transition: "background .12s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                  >
                    Order {o.id}
                  </button>
                ))}
              </div>
            </div>

            {/* order preview */}
            <div style={{ flex: 1.55, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <label style={{ ...SECTION, fontWeight: 500, fontSize: 22 }}>Order Preview</label>
              <div style={BOX}>
                {previewReady ? (
                  <div style={{ padding: "20px 24px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
                    {/* items summary */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {validItems.map((r, i) => {
                        const info = lookupBySku(r.sku);
                        return (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.7fr", gap: 16 }}>
                            <Field label={i === 0 ? "SKU" : ""} value={r.sku.toUpperCase()} sub={r.desc || info?.description} />
                            <Field label={i === 0 ? "Bin" : ""} value={info?.bin ?? "—"} />
                            <Field label={i === 0 ? "Tray" : ""} value={info?.tray ?? "—"} />
                            <Field label={i === 0 ? "Qty" : ""} value={r.qty} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ height: 1, background: "#e5e7eb" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16 }}>
                      <Field label="Employee Name" value={employee} />
                      <Field label="Priority" value={priority} />
                      <Field label="No of Items" value={String(validItems.length).padStart(2, "0")} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* confirm */}
            <div style={{ flex: 0.58, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <label style={{ ...SECTION, fontWeight: 500, fontSize: 22, visibility: "hidden" }}>Confirm</label>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, minHeight: 0, background: "#28954b", color: "#fff",
                  fontSize: 22, fontWeight: 700, letterSpacing: "0.5px",
                  border: "none", borderRadius: 10, cursor: "pointer", transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#21813f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#28954b"; }}
              >
                CONFIRM
              </button>
            </div>
          </div>

        </div>

        {/* ── MODAL ── */}
        {modal !== null && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)",
            borderRadius: 10,
          }}>
            <div style={{
              background: "rgba(255,255,255,0.42)",
              backdropFilter: "blur(11px)", WebkitBackdropFilter: "blur(11px)",
              borderRadius: 26, boxShadow: "0 24px 70px rgba(0,0,0,0.20)",
              border: "1px solid rgba(255,255,255,0.65)",
              padding: 44, boxSizing: "border-box",
              width: "min(780px, 90%)", maxHeight: "88%",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34,
            }}>
              <span style={{ fontSize: 30, fontWeight: 600, color: "#1a1a1a", textAlign: "center", lineHeight: 1.35 }}>
                {modal.kind === "success"
                  ? `Your Order ${modal.id} has been added to the Picklist Queue`
                  : (modal as { kind: "error"; msg: string }).msg}
              </span>
              <button
                onClick={handleOkay}
                style={{
                  background: "#0058f1", color: "#fff", fontSize: 24, fontWeight: 600,
                  border: "none", borderRadius: 12, padding: "15px 64px", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,88,241,0.35)", transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#0049cc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#0058f1"; }}
              >
                Okay
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
