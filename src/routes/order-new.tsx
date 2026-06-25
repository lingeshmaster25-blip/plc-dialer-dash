import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

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

function OrderNewPage() {
  const [qty, setQty] = useState(0);

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

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
                  <input style={FIELD} placeholder="Enter Employee Name" />
                  <div style={{ position: "relative" }}>
                    <select defaultValue="" style={{ ...FIELD, appearance: "none", cursor: "pointer", color: "#6b7280" }}>
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
                  <input style={FIELD} placeholder="*SKU Code" />
                  <input style={FIELD} placeholder="Description" />
                  <div style={{ position: "relative" }}>
                    <input style={FIELD} type="number" placeholder="Qty"
                      value={qty === 0 ? "" : qty}
                      onChange={(e) => setQty(Number(e.target.value) || 0)} />
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
              <div style={BOX} />
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
              <div style={BOX} />
            </div>

            {/* confirm */}
            <div style={{ flex: 0.58, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <label style={{ ...SECTION, fontWeight: 500, fontSize: 22, visibility: "hidden" }}>Confirm</label>
              <button style={{
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
      </div>
    </DashboardShell>
  );
}
