import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { hmiApi, type PlcStatus } from "@/lib/hmi-api";
import {
  Bell,
  Clock,
  Trash2,
  User,
  Upload,
  Download,
  Package,
  Search,
  Wrench,
  AlertTriangle,
  Settings,
  CheckCircle2,
  Timer,
  ShoppingCart,
  Truck,
  ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HmiDashboard,
});

// ─── Static mock data ──────────────────────────────────────────────────────────
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

// ─── Donut chart (SVG) ─────────────────────────────────────────────────────────
function DonutChart({ pct }: { pct: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth="14"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">
        {pct}%
      </text>
      <text x="70" y="82" textAnchor="middle" fontSize="9" fill="#6b7280" letterSpacing="1">
        AVAILABLE
      </text>
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
function HmiDashboard() {
  const [status, setStatus] = useState<PlcStatus | null>(null);
  const prevRef = useRef<PlcStatus | null>(null);
  const [uptime, setUptime] = useState("10h 25m");

  const addLog = useCallback((_level: string, _msg: string) => {}, []);

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

  const connected = status?.connected ?? false;
  const isRunning = connected;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: "#f0f2f5",
      }}
    >
      {/* ── TOP NAVBAR ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0f1729",
          padding: "0 24px",
          height: 56,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/trilo-logo.png" alt="Trilo Automation" style={{ height: 54, objectFit: "contain" }} />
        </div>

        {/* Status pill */}
        <div
          style={{
            background: isRunning ? "#14532d" : "#7f1d1d",
            border: `1.5px solid ${isRunning ? "#22c55e" : "#ef4444"}`,
            borderRadius: 999,
            padding: "6px 28px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isRunning ? "#22c55e" : "#ef4444",
              display: "inline-block",
              boxShadow: isRunning ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
            }}
          />
          <span
            style={{
              color: isRunning ? "#22c55e" : "#ef4444",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "2px",
            }}
          >
            {isRunning ? "RUNNING" : "STOPPED"}
          </span>
        </div>

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#94a3b8" }}>
          <Bell size={18} style={{ cursor: "pointer" }} />
          <Clock size={18} style={{ cursor: "pointer" }} />
          <Trash2 size={18} style={{ cursor: "pointer" }} />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#1e293b",
              border: "1.5px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <User size={16} color="#94a3b8" />
          </div>
        </div>
      </header>

      {/* ── BODY: main area + right panel ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>

        {/* ── LEFT: Logo canvas ── */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            margin: "12px 0 0 12px",
            borderRadius: "8px 8px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Large watermark Trilo logo */}
          <img
            src="/trilo-logo.png"
            alt="Trilo"
            style={{ width: 420, opacity: 0.12, objectFit: "contain", userSelect: "none", pointerEvents: "none" }}
          />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          style={{
            width: 340,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "12px 12px 0 12px",
            overflowY: "auto",
          }}
        >
          {/* Stat cards row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatCard
              icon={<Timer size={20} color="#22c55e" />}
              label="Uptime"
              value={uptime}
            />
            <StatCard
              icon={<ShoppingCart size={20} color="#f97316" />}
              label="Orders"
              value="32"
            />
          </div>

          {/* Stat cards row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatCard
              icon={<Truck size={20} color="#3b82f6" />}
              label="Active Order"
              value="#534"
              valueLarge
            />
            <StatCard
              icon={<ClipboardList size={20} color="#a855f7" />}
              label="Queue"
              value="125"
            />
          </div>

          {/* Recent Activity */}
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "14px 16px",
              flex: "0 0 auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.5px", color: "#111827" }}>
                RECENT ACTIVITY
              </span>
              <span style={{ color: "#3b82f6", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                View all activity
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <CheckCircle2 size={14} color="#22c55e" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#6b7280", width: 58, flexShrink: 0 }}>{item.time}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#111827", minWidth: 0, flexShrink: 0, width: 120 }}>
                    {item.action}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280", minWidth: 0 }}>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Overview */}
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.5px", color: "#111827" }}>
                INVENTORY OVERVIEW
              </span>
              <span style={{ color: "#3b82f6", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                View all
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <DonutChart pct={68.7} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {[
                  { label: "Total Trays", val: 17 },
                  { label: "Available", val: 11 },
                  { label: "Total Bins", val: 36 },
                  { label: "SKUs", val: 7 },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV BAR ── */}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          height: 100,
          background: "#f0f2f5",
          borderTop: "1px solid #e2e8f0",
          gap: 0,
        }}
      >
        {NAV_BUTTONS.map(({ label, sub, Icon }) => (
          <NavButton key={label} label={label} sub={sub} Icon={Icon} />
        ))}
        {/* E-STOP */}
        <button
          style={{
            flex: 1,
            background: "#dc2626",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <AlertTriangle size={28} color="#fff" strokeWidth={2.5} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "1px" }}>
            E-STOP
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  valueLarge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueLarge?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      </div>
      <span
        style={{
          fontSize: valueLarge ? 22 : 26,
          fontWeight: 800,
          color: "#111827",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function NavButton({
  label,
  sub,
  Icon,
}: {
  label: string;
  sub: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <button
      style={{
        flex: 1,
        background: "#f8fafc",
        border: "none",
        borderRight: "1px solid #e2e8f0",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "10px 4px",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color="#374151" />
      </div>
      <span style={{ fontWeight: 700, fontSize: 11, color: "#111827", letterSpacing: "0.5px" }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</span>
    </button>
  );
}
