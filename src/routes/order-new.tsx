import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { lookupBySku, usePutawayRecords } from "@/lib/inventory-store";

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

const RECENT_ORDERS = ["Order #532", "Order #530", "Order #528", "Order #526", "Order #524", "Order #522"];

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

// Sequential order numbers for newly confirmed orders.
let orderCounter = 534;

function OrderNewPage() {
  const [employee, setEmployee] = useState("");
  const [priority, setPriority] = useState("");
  const [sku, setSku] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(0);
  const [orderNo, setOrderNo] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  usePutawayRecords(); // re-render when putaway inventory changes
  const avail = lookupBySku(sku);
  const previewReady = !!avail && qty > 0 && employee.trim() !== "" && priority !== "";

  const handleConfirm = () => {
    if (!previewReady) {
      setShowValidation(true);
      return;
    }
    setOrderNo(orderCounter);
    orderCounter += 2;
  };

  const handleOkay = () => {
    setOrderNo(null);
    setEmployee("");
    setPriority("");
    setSku("");
    setDesc("");
    setQty(0);
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
                  <input
                    style={{
                      ...FIELD,
                      border: showValidation && employee.trim() === "" ? "1.5px solid #db0000" : "1px solid #dadbdf",
                    }}
                    placeholder="Enter Employee Name"
                    value={employee}
                    onChange={(e) => { setEmployee(e.target.value); setShowValidation(false); }}
                  />
                  <div style={{ position: "relative" }}>
                    <select
                      value={priority}
                      onChange={(e) => { setPriority(e.target.value); setShowValidation(false); }}
                      style={{
                        ...FIELD,
                        appearance: "none", cursor: "pointer",
                        color: priority ? "#111827" : "#9ca3af",
                        border: showValidation && priority === "" ? "1.5px solid #db0000" : "1px solid #dadbdf",
                      }}
                    >
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 0.7fr", gap: 18 }}>
                  <input
                    style={{
                      ...FIELD,
                      border: showValidation && sku.trim() === "" ? "1.5px solid #db0000" : "1px solid #dadbdf",
                    }}
                    placeholder="*SKU Code"
                    value={sku}
                    onChange={(e) => { setSku(e.target.value); setShowValidation(false); }}
                  />
                  <input
                    style={FIELD}
                    placeholder="Description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                  <div style={{ position: "relative" }}>
                    <input
                      style={{
                        ...FIELD,
                        border: showValidation && qty === 0 ? "1.5px solid #db0000" : "1px solid #dadbdf",
                      }}
                      type="number"
                      placeholder="Qty"
                      value={qty === 0 ? "" : qty}
                      onChange={(e) => { setQty(Number(e.target.value) || 0); setShowValidation(false); }}
                    />
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column" }}>
                      <ChevronUp size={15} color="#374151" style={{ cursor: "pointer" }} onClick={() => setQty((q) => q + 1)} />
                      <ChevronDown size={15} color="#374151" style={{ cursor: "pointer" }} onClick={() => setQty((q) => Math.max(0, q - 1))} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ color: "#1068ff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>+Add Items</span>
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
                    <Field label="SKU" value={sku} sub={desc || avail.description} />
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
              <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {RECENT_ORDERS.map((o) => (
                  <button key={o} style={{
                    background: "#fff", border: "1px solid #d0d4da", borderRadius: 8,
                    fontSize: 17, fontWeight: 500, color: "#1a1a1a", cursor: "pointer",
                    transition: "background .12s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* order preview */}
            <div style={{ flex: 1.55, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <label style={{ ...SECTION, fontWeight: 500, fontSize: 22 }}>Order Preview</label>
              <div style={BOX}>
                {previewReady && avail ? (
                  <div style={{ padding: "20px 24px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 22, overflow: "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.7fr", gap: 16 }}>
                      <Field label="SKU" value={sku} sub={desc || avail.description} />
                      <Field label="Bin" value={avail.bin} />
                      <Field label="Tray" value={avail.tray} />
                      <Field label="Qty" value={qty} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16 }}>
                      <Field label="Employee Name" value={employee} />
                      <Field label="Priority" value={priority} />
                      <Field label="No of Items" value={String(1).padStart(2, "0")} />
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
                  border: "none", borderRadius: 10, transition: "background .15s, opacity .15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#21813f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#28954b"; }}
              >
                CONFIRM
              </button>
            </div>
          </div>

        </div>

        {/* ── VALIDATION MODAL ── */}
        {showValidation && (
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
              width: "min(780px, 90%)", height: 460, maxHeight: "88%",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28,
            }}>
              <AlertCircle size={56} color="#db0000" strokeWidth={1.8} />
              <span style={{ fontSize: 30, fontWeight: 600, color: "#1a1a1a", textAlign: "center", lineHeight: 1.35 }}>
                Please enter the details
              </span>
              <p style={{ fontSize: 17, color: "#6b7280", textAlign: "center", margin: 0, lineHeight: 1.6, maxWidth: 480 }}>
                Fill in Employee Name, Priority, SKU Code, and Quantity before confirming the order.
              </p>
              <button
                onClick={() => setShowValidation(false)}
                style={{
                  background: "#db0000", color: "#fff", fontSize: 24, fontWeight: 600,
                  border: "none", borderRadius: 12, padding: "15px 64px", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(219,0,0,0.30)", transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#b80000"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#db0000"; }}
              >
                Okay
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS MODAL ── */}
        {orderNo !== null && (
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
              width: "min(780px, 90%)", height: 460, maxHeight: "88%",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34,
            }}>
              <span style={{ fontSize: 30, fontWeight: 600, color: "#1a1a1a", textAlign: "center", lineHeight: 1.35 }}>
                Your Order #{orderNo} has been added to the Picklist Queue
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
