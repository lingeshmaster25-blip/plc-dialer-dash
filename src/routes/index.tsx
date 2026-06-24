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
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width="130" height="130" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="#22c55e" strokeWidth="14"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 70 70)" />
      <text x="70" y="66" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">{pct}%</text>
      <text x="70" y="82" textAnchor="middle" fontSize="9" fill="#6b7280" letterSpacing="1">AVAILABLE</text>
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
      fontFamily: "'Inter','Segoe UI',sans-serif", background: "#e8eaed",
    }}>

      {/* ── NAVBAR ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0f1729", padding: "0 20px", height: 56, flexShrink: 0, overflow: "visible",
      }}>
        <img src="/trilo-logo.png" alt="Trilo" style={{ height: 100, objectFit: "contain", position: "relative", zIndex: 10 }} />

        <div style={{
          background: isRunning ? "#14532d" : "#7f1d1d",
          border: `1.5px solid ${isRunning ? "#22c55e" : "#ef4444"}`,
          borderRadius: 999, padding: "7px 32px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isRunning ? "#22c55e" : "#ef4444",
            boxShadow: isRunning ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
          }} />
          <span style={{
            color: isRunning ? "#22c55e" : "#ef4444",
            fontWeight: 700, fontSize: 13, letterSpacing: "2px",
          }}>
            {isRunning ? "RUNNING" : "STOPPED"}
          </span>
        </div>

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
      <div style={{ display: "flex", flex: 1, overflow: "hidden", padding: "10px", gap: "10px" }}>

        {/* Left canvas */}
        <div style={{
          flex: 1, background: "#fff", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          <img src="/trilo-logo.png" alt="Trilo watermark" style={{
            width: "55%", maxWidth: 500, opacity: 0.1,
            objectFit: "contain", userSelect: "none", pointerEvents: "none",
          }} />
        </div>

        {/* Right panel */}
        <div style={{
          width: 320, flexShrink: 0,
          display: "flex", flexDirection: "column", gap: 10, overflowY: "auto",
        }}>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Timer size={18} color="#22c55e" />
                <span style={{ fontSize: 11, color: "#6b7280" }}>Uptime</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>10h 25m</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <ShoppingCart size={18} color="#f97316" />
                <span style={{ fontSize: 11, color: "#6b7280" }}>Orders</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>32</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Truck size={18} color="#3b82f6" />
                <span style={{ fontSize: 11, color: "#6b7280" }}>Active Order</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>#534</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <ClipboardList size={18} color="#a855f7" />
                <span style={{ fontSize: 11, color: "#6b7280" }}>Queue</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>125</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: "#fff", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#111827", letterSpacing: "0.5px" }}>RECENT ACTIVITY</span>
              <span style={{ color: "#3b82f6", fontSize: 11, cursor: "pointer", fontWeight: 500 }}>View all activity</span>
            </div>
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 7 }}>
                <CheckCircle2 size={13} color="#22c55e" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#6b7280", width: 56, flexShrink: 0 }}>{item.time}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#111827", width: 110, flexShrink: 0 }}>{item.action}</span>
                <span style={{ fontSize: 10, color: "#6b7280" }}>{item.detail}</span>
              </div>
            ))}
          </div>

          {/* Inventory Overview */}
          <div style={{ background: "#fff", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#111827", letterSpacing: "0.5px" }}>INVENTORY OVERVIEW</span>
              <span style={{ color: "#3b82f6", fontSize: 11, cursor: "pointer", fontWeight: 500 }}>View all</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <DonutChart pct={68.7} />
              <div style={{ flex: 1 }}>
                {[
                  { label: "Total Trays", val: 17 },
                  { label: "Available", val: 11 },
                  { label: "Total Bins", val: 36 },
                  { label: "SKUs", val: 7 },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        display: "flex", flexShrink: 0, height: 96,
        padding: "8px 10px", gap: 8, background: "#e8eaed",
      }}>
        {NAV_BUTTONS.map(({ label, sub, Icon }) => (
          <button key={label}
            style={{
              flex: 1, minWidth: 0, background: "#f8fafc", border: "none",
              borderRadius: 8, cursor: "pointer", display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 3, padding: "8px 4px", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
          >
            <div style={{
              width: 38, height: 38, borderRadius: "50%", background: "#e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={17} color="#374151" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 10, color: "#111827", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>
              {label}
            </span>
            <span style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap" }}>{sub}</span>
          </button>
        ))}

        {/* E-STOP */}
        <button style={{
          flex: 1, minWidth: 0, background: "#dc2626", border: "none",
          borderRadius: 8, cursor: "pointer", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <AlertTriangle size={26} color="#fff" strokeWidth={2.5} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: "1px" }}>E-STOP</span>
        </button>
      </div>

    </div>
  );
}
