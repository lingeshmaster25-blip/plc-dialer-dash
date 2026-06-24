import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { hmiApi, type PlcStatus } from "@/lib/hmi-api";
import {
  Bell, Clock, Trash2, User, Upload, Download, Package,
  Search, Wrench, AlertTriangle, Settings, CheckCircle2,
  Timer, ShoppingCart, Truck, ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HmiDashboard,
});

const RECENT_ACTIVITY = [
  { time: "10:24 AM", action: "Order #424 Picked", detail: "Tray T12 Bin B5" },
  { time: "10:18 AM", action: "Tray 14 Returned", detail: "By Operator John" },
  { time: "10:07 AM", action: "Calibration Finished", detail: "All Systems Normal" },
  { time: "09:45 AM", action: "Order #422 Picked", detail: "Tray T07 Bin B7" },
  { time: "09:37 AM", action: "Order #420 Picked", detail: "Tray T08 Bin B3" },
  { time: "09:32 AM", action: "Tray 10 Picked", detail: "By Operator Bob" },
];

const NAV_BUTTONS = [
  { label: "PUTAWAY", sub: "Store Items", Icon: Upload },
  { label: "PICKLIST", sub: "Retrieve Items", Icon: Download },
  { label: "ORDERS", sub: "Manage Orders", Icon: Package },
  { label: "SEARCH", sub: "Find Items", Icon: Search },
  { label: "MAINTENANCE", sub: "Check Status", Icon: Wrench },
  { label: "TROUBLESHOOT", sub: "Manage Alerts", Icon: AlertTriangle },
  { label: "SETTINGS", sub: "System Config", Icon: Settings },
];

function DonutChart({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="13" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="#22c55e" strokeWidth="13"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 65 65)" />
      <text x="65" y="61" textAnchor="middle" fontSize="17" fontWeight="700" fill="#111827">{pct}%</text>
      <text x="65" y="76" textAnchor="middle" fontSize="8" fill="#6b7280" letterSpacing="1">AVAILABLE</text>
    </svg>
  );
}

function HmiDashboard() {
  const [status, setStatus] = useState<PlcStatus | null>(null);
  const prevRef = useRef<PlcStatus | null>(null);
  const addLog = useCallback((_l: string, _m: string) => {}, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await hmiApi.status();
        if (cancelled) return;
        prevRef.current = s;
        setStatus(s);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 500);
    return () => { cancelled = true; clearInterval(id); };
  }, [addLog]);

  const isRunning = status?.connected ?? false;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", width: "100vw", overflow: "hidden",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      background: "#d1d5db",
    }}>

      {/* ── NAVBAR: 56px, dark ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0f1729", padding: "0 20px",
        height: 56, flexShrink: 0, zIndex: 10,
      }}>
        <img src="/trilo-logo.png" alt="Trilo" style={{ height: 44, objectFit: "contain" }} />

        {/* Status pill */}
        <div style={{
          background: isRunning ? "#14532d" : "#7f1d1d",
          border: `1.5px solid ${isRunning ? "#22c55e" : "#ef4444"}`,
          borderRadius: 999, padding: "6px 32px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isRunning ? "#22c55e" : "#ef4444",
            boxShadow: isRunning ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
            display: "inline-block",
          }} />
          <span style={{ color: isRunning ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: 13, letterSpacing: "2px" }}>
            {isRunning ? "RUNNING" : "STOPPED"}
          </span>
        </div>

        {/* Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Bell size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
          <Clock size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
          <Trash2 size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "#1e293b", border: "1.5px solid #334155",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <User size={16} color="#94a3b8" />
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      {/* gap between header and body = 8px via background showing through */}
      <div style={{
        display: "flex", flex: 1, overflow: "hidden",
        gap: 8, padding: "8px 8px 0 8px",
      }}>

        {/* Left white canvas */}
        <div style={{
          flex: 1, background: "#fff",
          borderRadius: "6px 6px 0 0",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          <img src="/trilo-logo.png" alt="" style={{
            width: "52%", maxWidth: 480, opacity: 0.1,
            objectFit: "contain", userSelect: "none", pointerEvents: "none",
          }} />
        </div>

        {/* Right panel — white cards, no outer bg */}
        <div style={{
          width: 330, flexShrink: 0,
          display: "flex", flexDirection: "column",
          gap: 8, overflowY: "auto",
        }}>

          {/* Stat cards 2x2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {/* Uptime */}
            <div style={{ background: "#fff", borderRadius: 6, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Timer size={18} color="#22c55e" />
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Uptime</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>10h 25m</div>
            </div>
            {/* Orders */}
            <div style={{ background: "#fff", borderRadius: 6, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ShoppingCart size={18} color="#f97316" />
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Orders</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>32</div>
            </div>
            {/* Active Order */}
            <div style={{ background: "#fff", borderRadius: 6, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Truck size={18} color="#3b82f6" />
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Active Order</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1 }}>#534</div>
            </div>
            {/* Queue */}
            <div style={{ background: "#fff", borderRadius: 6, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ClipboardList size={18} color="#a855f7" />
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Queue</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>125</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: "#fff", borderRadius: 6, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 11, color: "#111827", letterSpacing: "0.8px" }}>RECENT ACTIVITY</span>
              <span style={{ color: "#3b82f6", fontSize: 11, cursor: "pointer", fontWeight: 500 }}>View all activity</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#6b7280", width: 54, flexShrink: 0 }}>{item.time}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#111827", width: 112, flexShrink: 0 }}>{item.action}</span>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Overview */}
          <div style={{ background: "#fff", borderRadius: 6, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 11, color: "#111827", letterSpacing: "0.8px" }}>INVENTORY OVERVIEW</span>
              <span style={{ color: "#3b82f6", fontSize: 11, cursor: "pointer", fontWeight: 500 }}>View all</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <DonutChart pct={68.7} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Total Trays", val: 17 },
                  { label: "Available", val: 11 },
                  { label: "Total Bins", val: 36 },
                  { label: "SKUs", val: 7 },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM NAV: full width, no gaps, dividers between buttons ── */}
      <div style={{
        display: "flex", flexShrink: 0,
        height: 100, background: "#d1d5db",
        paddingTop: 8,
      }}>
        {NAV_BUTTONS.map(({ label, sub, Icon }, i) => (
          <button key={label}
            style={{
              flex: 1, background: "#f9fafb", border: "none",
              borderLeft: i === 0 ? "none" : "1px solid #e5e7eb",
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              padding: "10px 6px", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f9fafb")}
          >
            <div style={{
              width: 42, height: 42, borderRadius: "50%", background: "#e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={18} color="#374151" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 11, color: "#111827", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>
              {label}
            </span>
            <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap" }}>{sub}</span>
          </button>
        ))}

        {/* E-STOP */}
        <button style={{
          flex: 1, background: "#dc2626", border: "none",
          cursor: "pointer", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <AlertTriangle size={30} color="#fff" strokeWidth={2.5} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "1px" }}>E-STOP</span>
        </button>
      </div>

    </div>
  );
}
