import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { hmiApi, type PlcStatus } from "@/lib/hmi-api";
import { RECENT_ACTIVITY, useDashboardMetrics } from "@/lib/dashboard-store";
import {
  Bell, Clock, Wifi, User, Home, Upload, Download, Package,
  Search, AlertTriangle, Settings, CheckCircle2,
  Truck, ClipboardList, AlertCircle,
} from "lucide-react";

// `to` is the route each button navigates to. Only "/" and "/putaway"
// exist today — extend these as new module pages are added.
const NAV_BUTTONS = [
  { label: "PUTAWAY", sub: "Store Items", Icon: Upload, to: "/putaway" },
  { label: "PICKLIST", sub: "Retrieve Items", Icon: Download, to: "/picklist" },
  { label: "ORDERS", sub: "Manage Orders", Icon: Package, to: "/orders" },
  { label: "SEARCH", sub: "Find Items", Icon: Search, to: "/search" },
  { label: "MAINTENANCE", sub: "Check Status", Icon: Clock, to: "/" },
  { label: "TROUBLESHOOT", sub: "Manage Alerts", Icon: AlertCircle, to: "/troubleshoot" },
  { label: "SETTINGS", sub: "System Config", Icon: Settings, to: "/" },
] as const;

export const CARD_SHADOW = "0 1px 3px rgba(16,24,40,0.08)";

function DonutChart({ pct, size = 128 }: { pct: number; size?: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
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
        <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1.05, whiteSpace: "nowrap" }}>{value}</span>
      </div>
    </div>
  );
}

/**
 * Shared app frame: dark navbar, the right-hand stats/activity/inventory
 * column, and the bottom navigation. `children` fills the large left panel.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<PlcStatus | null>(null);
  const prevRef = useRef<PlcStatus | null>(null);
  const [now, setNow] = useState(new Date());
  const [estop, setEstop] = useState(false);
  const m = useDashboardMetrics();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const triggerEstop = () => {
    setEstop(true);
    // Best-effort hardware stop; ignore errors when no PLC backend is present.
    try { Promise.resolve(hmiApi.stop()).catch(() => {}); } catch {}
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
  }, []);

  const isRunning = !estop && (status?.connected ?? true);

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
        <img src="/trilo-logo.png" alt="Trilo Automation" style={{ height: 100, objectFit: "contain", cursor: "pointer" }}
          onClick={() => navigate({ to: "/" })} />

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
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <Home size={19} color="#c7cdd8" strokeWidth={2} style={{ cursor: "pointer" }}
            onClick={() => navigate({ to: "/" })} />
          <Bell size={19} color="#c7cdd8" strokeWidth={2} style={{ cursor: "pointer" }} />
          <span style={{
            color: "#dbe0ea", fontSize: 14, fontWeight: 600,
            fontVariantNumeric: "tabular-nums", letterSpacing: "0.5px",
            minWidth: 96, textAlign: "center",
          }}>
            {now.toLocaleTimeString()}
          </span>
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

        {/* Left panel (page content) */}
        <div style={{
          flex: 1, background: "#fff", borderRadius: 10,
          border: "1px solid #edeff2", boxShadow: CARD_SHADOW,
          display: "flex", overflow: "hidden", minWidth: 0,
        }}>
          {children}
        </div>

        {/* Right column */}
        <div style={{
          width: 332, flexShrink: 0, minWidth: 0,
          display: "flex", flexDirection: "column",
          gap: 10, overflow: "hidden",
        }}>

          {/* 2×2 stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatCard Icon={Clock} color="#22c55e" label="Uptime" value={m.uptime} />
            <StatCard Icon={Package} color="#f97316" label="Orders" value={String(m.orders)} />
            <StatCard Icon={Truck} color="#2563eb" label="Active Order" value={m.activeOrder} />
            <StatCard Icon={ClipboardList} color="#a21caf" label="Queue" value={String(m.queue)} />
          </div>

          {/* Recent Activity */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #edeff2", boxShadow: CARD_SHADOW }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#111827", letterSpacing: "0.6px" }}>RECENT ACTIVITY</span>
              <span style={{ color: "#2563eb", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>View all activity</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {RECENT_ACTIVITY.length === 0 ? (
                <span style={{ fontSize: 11, color: "#9ca3af" }}>No recent activity.</span>
              ) : RECENT_ACTIVITY.map((item, i) => (
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
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #edeff2", boxShadow: CARD_SHADOW }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#111827", letterSpacing: "0.6px" }}>INVENTORY OVERVIEW</span>
              <span style={{ color: "#2563eb", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>View all</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <DonutChart pct={m.availablePct} size={150} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignSelf: "stretch", paddingTop: 4, paddingBottom: 4 }}>
                {[
                  { label: "Total Trays", val: m.totalTrays },
                  { label: "Available", val: m.available },
                  { label: "Total Bins", val: m.totalBins },
                  { label: "SKUs", val: m.skus },
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
        {NAV_BUTTONS.map(({ label, sub, Icon, to }) => {
          const active = to !== "/" && pathname === to;
          const restShadow = active ? "0 3px 12px rgba(0,88,241,0.22)" : CARD_SHADOW;
          return (
          <Link key={label}
            to={to}
            style={{
              flex: 1, background: active ? "#eef3ff" : "#fff", borderRadius: 10,
              border: active ? "1.5px solid #0058f1" : "1px solid #edeff2", boxShadow: restShadow,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 9,
              padding: "10px 6px", transition: "box-shadow .15s, transform .12s",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 18px rgba(16,24,40,0.18)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = restShadow;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: active ? "#0058f1" : "#a7a7a7",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={26} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: active ? "#0058f1" : "#111827", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
              {label}
            </span>
            <span style={{ fontSize: 12, color: active ? "#3b6fd4" : "#6b7280", whiteSpace: "nowrap" }}>{sub}</span>
          </Link>
          );
        })}

        {/* E-STOP */}
        <button
          onClick={triggerEstop}
          style={{
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

      {/* ───────────── EMERGENCY STOP OVERLAY ───────────── */}
      {estop && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(120,0,0,0.28)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, border: "3px solid #db0000",
            boxShadow: "0 24px 70px rgba(0,0,0,0.35)", padding: "40px 56px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
            width: "min(560px, 90%)", textAlign: "center",
          }}>
            <div style={{
              width: 84, height: 84, borderRadius: "50%", background: "#fde2e2",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle size={46} color="#db0000" strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#db0000", letterSpacing: "0.5px" }}>
              EMERGENCY STOP ACTIVATED
            </span>
            <span style={{ fontSize: 17, color: "#4b5563", lineHeight: 1.4 }}>
              All operations have been halted. Inspect the system and ensure it is safe before resuming.
            </span>
            <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
              <button
                onClick={() => setEstop(false)}
                style={{
                  background: "#fff", color: "#1f2937", fontSize: 18, fontWeight: 700,
                  border: "1px solid #d0d4da", borderRadius: 10, padding: "14px 40px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setEstop(false)}
                style={{
                  background: "#1e8449", color: "#fff", fontSize: 18, fontWeight: 700,
                  border: "none", borderRadius: 10, padding: "14px 40px", cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#196e3c"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#1e8449"; }}
              >
                Reset System
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
