import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { hmiApi, type PlcStatus } from "@/lib/hmi-api";
import {
  Bell, Clock, Wifi, User, Home, Upload, Download, Package,
  Search, AlertTriangle, Settings, CheckCircle2,
  Truck, ClipboardList, AlertCircle, OctagonX,
} from "lucide-react";

/* ─────────────────────────────────────────────
   E-STOP Confirmation Modal
───────────────────────────────────────────── */
function EStopModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16,
          width: "min(480px, 92vw)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
          animation: "estop-pop .18s cubic-bezier(.34,1.56,.64,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes estop-pop {
            from { transform: scale(.88); opacity: 0; }
            to   { transform: scale(1);  opacity: 1; }
          }
        `}</style>

        {/* Red header band */}
        <div style={{
          background: "#db0000",
          padding: "28px 32px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "2.5px solid rgba(255,255,255,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <OctagonX size={38} color="#fff" strokeWidth={2.25} />
          </div>
          <span style={{
            color: "#fff", fontSize: 22, fontWeight: 800,
            letterSpacing: "2.5px", textTransform: "uppercase",
          }}>
            Force Stop
          </span>
          <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 12.5, fontWeight: 600, letterSpacing: "1px" }}>
            EMERGENCY STOP INITIATED
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Warning box */}
          <div style={{
            background: "#fff5f5", border: "1.5px solid #fecaca",
            borderRadius: 10, padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: "#991b1b" }}>
              ⚠&nbsp; VLM will stop immediately
            </span>
            <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65 }}>
              Triggering an E-Stop will immediately halt the Vertical Lift Module —
              the lifting platform, tray carrier, and insertion/extraction mechanism
              will lock in place. Any tray currently in transit will be held mid-cycle.
              Active picks and putaways will be suspended. A manual inspection and
              controlled restart via the operator panel will be required before
              resuming operations.
            </span>
          </div>

          {/* Affected systems */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {["Lift Platform", "Tray Carrier", "Extraction Arm", "Tray Inserter", "Drive Motor"].map((sys) => (
              <span key={sys} style={{
                padding: "5px 12px", borderRadius: 20,
                background: "#fee2e2", color: "#991b1b",
                fontSize: 12, fontWeight: 600, border: "1px solid #fca5a5",
              }}>
                ⬤ {sys}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 9,
                border: "1.5px solid #d1d5db", background: "#fff",
                fontSize: 15, fontWeight: 700, color: "#374151",
                cursor: "pointer", transition: "background .12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 9,
                border: "none", background: "#db0000",
                fontSize: 15, fontWeight: 700, color: "#fff",
                cursor: "pointer", transition: "background .12s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#b91c1c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#db0000"; }}
            >
              <OctagonX size={16} strokeWidth={2.5} />
              Confirm E-Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const RECENT_ACTIVITY = [
  { time: "10:24 AM", action: "Order #424 Picked", detail: "Tray T12 Bin B5" },
  { time: "10:18 AM", action: "Tray 14 Returned", detail: "By Operator John" },
  { time: "10:07 AM", action: "Calibration Finished", detail: "All Systems Normal" },
  { time: "09:45 AM", action: "Order #422 Picked", detail: "Tray T07 Bin B7" },
  { time: "09:37 AM", action: "Order #420 Picked", detail: "Tray T08 Bin B3" },
  { time: "09:32 AM", action: "Tray 10 Picked", detail: "By Operator Bob" },
];

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

export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<PlcStatus | null>(null);
  const prevRef = useRef<PlcStatus | null>(null);
  const [now, setNow] = useState(new Date());
  const [estopOpen, setEstopOpen] = useState(false);
  const [stopped, setStopped] = useState(false);

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

  const isRunning = stopped ? false : (status?.connected ?? true);

  const handleEstopConfirm = () => {
    setStopped(true);
    setEstopOpen(false);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", width: "100vw", overflow: "hidden",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      background: "#d4d7db",
    }}>

      {/* E-STOP modal */}
      {estopOpen && (
        <EStopModal
          onConfirm={handleEstopConfirm}
          onCancel={() => setEstopOpen(false)}
        />
      )}

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
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #edeff2", boxShadow: CARD_SHADOW }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#111827", letterSpacing: "0.6px" }}>INVENTORY OVERVIEW</span>
              <span style={{ color: "#2563eb", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>View all</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <DonutChart pct={68.7} size={150} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignSelf: "stretch", paddingTop: 4, paddingBottom: 4 }}>
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
        {NAV_BUTTONS.map(({ label, sub, Icon, to }) => (
          <Link key={label}
            to={to}
            style={{
              flex: 1, background: "#fff", borderRadius: 10,
              border: "1px solid #edeff2", boxShadow: CARD_SHADOW,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 9,
              padding: "10px 6px", transition: "box-shadow .15s, transform .05s",
              textDecoration: "none",
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
          </Link>
        ))}

        {/* E-STOP */}
        <button
          onClick={() => setEstopOpen(true)}
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

    </div>
  );
}
