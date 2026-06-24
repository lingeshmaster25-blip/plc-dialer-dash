import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { hmiApi, type PlcStatus } from "@/lib/hmi-api";
import {
  Bell, Clock, Wifi, User, Upload, Download, Package,
  Search, Wrench, AlertTriangle, Settings, CheckCircle2,
  Truck, ClipboardList, AlertCircle,
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
  { label: "MAINTENANCE", sub: "Check Status", Icon: Clock },
  { label: "TROUBLESHOOT", sub: "Manage Alerts", Icon: AlertCircle },
  { label: "SETTINGS", sub: "System Config", Icon: Settings },
];

const CARD_SHADOW = "0 1px 3px rgba(16,24,40,0.08)";

function DonutChart({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width="128" height="128" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="#22c55e" strokeWidth="14"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 65 65)" />
      <text x="65" y="62" textAnchor="middle" fontSize="19" fontWeight="700" fill="#111827">{pct}%</text>
      <text x="65" y="78" textAnchor="middle" fontSize="8.5" fill="#9ca3af" letterSpacing="1.2">AVAILABLE</text>
    </svg>
  );
}

function StatCard({ Icon, color, label, value }: { Icon: typeof Clock; color: string; label: string; value: string }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "16px 18px",
      border: "1px solid #edeff2", boxShadow: CARD_SHADOW,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <Icon size={30} color={color} strokeWidth={2} style={{ flexShrink: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 400 }}>{label}</span>
        <span style={{ fontSize: 23, fontWeight: 800, color: "#111827", lineHeight: 1.05 }}>{value}</span>
      </div>
    </div>
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

  const isRunning = status?.connected ?? true;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", width: "100vw", overflow: "hidden",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      background: "#d4d7db",
    }}>

      {/* ───────────────── NAVBAR ───────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#021135", padding: "0 26px",
        height: 64, flexShrink: 0, zIndex: 10, position: "relative",
      }}>
        <img src="/trilo-logo.png" alt="Trilo Automation" style={{ height: 42, objectFit: "contain" }} />

        {/* Status pill — absolutely centered */}
        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
          background: isRunning ? "#0b6b32" : "#7f1d1d",
          border: `2px solid ${isRunning ? "#22c55e" : "#ef4444"}`,
          borderRadius: 999, padding: "9px 54px",
          boxShadow: isRunning ? "0 0 18px rgba(34,197,94,0.45)" : "0 0 18px rgba(239,68,68,0.45)",
        }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "3px" }}>
            {isRunning ? "RUNNING" : "STOPPED"}
          </span>
        </div>

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Bell size={19} color="#c7cdd8" strokeWidth={2} style={{ cursor: "pointer" }} />
          <Clock size={19} color="#c7cdd8" strokeWidth={2} style={{ cursor: "pointer" }} />
          <Wifi size={19} color="#c7cdd8" strokeWidth={2} style={{ cursor: "pointer" }} />
          <div style={{ width: 1, height: 26, background: "#2a3a5c" }} />
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "radial-gradient(circle at 50% 35%, #5b6b86 0%, #2b3852 70%, #1b2436 100%)",
            border: "1.5px solid #3a4866",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", overflow: "hidden",
          }}>
            <User size={18} color="#d7dce6" />
          </div>
        </div>
      </header>

      {/* ───────────────── BODY ───────────────── */}
      <div style={{
        display: "flex", flex: 1, overflow: "hidden",
        gap: 10, padding: "10px 10px 0 10px",
      }}>

        {/* Left canvas with watermark */}
        <div style={{
          flex: 1, background: "#fff", borderRadius: 10,
          border: "1px solid #edeff2", boxShadow: CARD_SHADOW,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          <img src="/trilo-mark.png" alt="" style={{
            height: "62%", maxHeight: 470, opacity: 0.13,
            objectFit: "contain", userSelect: "none", pointerEvents: "none",
          }} />
        </div>

        {/* Right column */}
        <div style={{
          width: 332, flexShrink: 0, minWidth: 0,
          display: "flex", flexDirection: "column",
          gap: 10, overflow: "hidden",
        }}>

          {/* 2×2 stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatCard Icon={Clock} color="#22c55e" label="Uptime" value="10h 25m" />
            <StatCard Icon={Package} color="#f97316" label="Orders" value="32" />
            <StatCard Icon={Truck} color="#2563eb" label="Active Order" value="#534" />
            <StatCard Icon={ClipboardList} color="#a21caf" label="Queue" value="125" />
          </div>

          {/* Recent Activity */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #edeff2", boxShadow: CARD_SHADOW }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#111827", letterSpacing: "0.6px" }}>RECENT ACTIVITY</span>
              <span style={{ color: "#2563eb", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>View all activity</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <CheckCircle2 size={15} color="#fff" fill="#22c55e" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#6b7280", width: 52, flexShrink: 0 }}>{item.time}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#111827", width: 108, flexShrink: 0 }}>{item.action}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Overview */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #edeff2", boxShadow: CARD_SHADOW }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#111827", letterSpacing: "0.6px" }}>INVENTORY OVERVIEW</span>
              <span style={{ color: "#2563eb", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>View all</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <DonutChart pct={68.7} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 13 }}>
                {[
                  { label: "Total Trays", val: 17 },
                  { label: "Available", val: 11 },
                  { label: "Total Bins", val: 36 },
                  { label: "SKUs", val: 7 },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, color: "#6b7280" }}>{r.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ───────────────── BOTTOM NAV ───────────────── */}
      <div style={{
        display: "flex", flexShrink: 0, gap: 10,
        height: 150, padding: "10px",
      }}>
        {NAV_BUTTONS.map(({ label, sub, Icon }) => (
          <button key={label}
            style={{
              flex: 1, background: "#fff", borderRadius: 10,
              border: "1px solid #edeff2", boxShadow: CARD_SHADOW,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 9,
              padding: "10px 6px", transition: "box-shadow .15s, transform .05s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,24,40,0.14)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = CARD_SHADOW; }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "#a7a7a7",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={26} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#111827", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
              {label}
            </span>
            <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{sub}</span>
          </button>
        ))}

        {/* E-STOP */}
        <button style={{
          flex: 1, background: "#db0000", borderRadius: 10, border: "none",
          boxShadow: CARD_SHADOW, cursor: "pointer", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "background .15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#c40000"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#db0000"; }}
        >
          <AlertTriangle size={40} color="#fff" strokeWidth={2.25} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "1px" }}>E-STOP</span>
        </button>
      </div>

    </div>
  );
}
