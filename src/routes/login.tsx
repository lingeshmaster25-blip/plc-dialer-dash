import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Clock, Wifi, User } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// Drop your machine render in /public as "startup.png" (or change this path).
const STARTUP_IMG = "/startup.png";

const MASTER_USER = "Trilo";
const MASTER_KEY = "trilo@2026";

const FIELD: React.CSSProperties = {
  width: "100%", background: "#e3e5e8", border: "1px solid #d7dade",
  borderRadius: 10, padding: "16px 18px", fontSize: 17, color: "#111827",
  outline: "none", boxSizing: "border-box",
};

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const login = () => {
    const ok = username.trim().toLowerCase() === MASTER_USER.toLowerCase() && password === MASTER_KEY;
    if (!ok) { setError(true); return; }
    try { localStorage.setItem("trilo.auth", "1"); } catch { /* ignore */ }
    navigate({ to: "/" });
  };

  return (
    <div style={{ height: "100vh", background: "#d4d7db", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Top navbar ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#021135", padding: "0 26px", height: 64, flexShrink: 0, position: "relative",
      }}>
        <img src="/trilo-logo.png" alt="Trilo Automation" style={{ height: 100, objectFit: "contain" }} />

        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
          background: "#0b6b32", border: "2px solid #22c55e", borderRadius: 999, padding: "9px 54px",
          boxShadow: "0 0 18px rgba(34,197,94,0.45)",
        }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "3px" }}>RUNNING</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Bell size={19} color="#c7cdd8" strokeWidth={2} />
          <Clock size={19} color="#c7cdd8" strokeWidth={2} />
          <Wifi size={19} color="#c7cdd8" strokeWidth={2} />
          <div style={{ width: 1, height: 26, background: "#2a3a63" }} />
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: "#1b2a4d",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={18} color="#c7cdd8" strokeWidth={2} />
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ flex: 1, minHeight: 0, padding: 16, display: "flex" }}>
        <div style={{
          flex: 1, minWidth: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18,
          boxShadow: "0 1px 4px rgba(16,24,40,0.06)", padding: "40px 56px",
          display: "flex", alignItems: "stretch", gap: 56, overflow: "hidden",
        }}>

          {/* Left: machine image (drop startup.png into /public) */}
          <div style={{
            flex: 1.05, minWidth: 0, borderRadius: 20, overflow: "hidden",
            background: "linear-gradient(135deg, #3b3550 0%, #272438 100%)",
            boxShadow: "0 10px 30px rgba(16,24,40,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img
              src={STARTUP_IMG}
              alt="TriloLift"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>

          {/* Right: login card */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: "100%", maxWidth: 640, border: "1px solid #e5e7eb", borderRadius: 16,
              boxShadow: "0 1px 8px rgba(16,24,40,0.10)", padding: "44px 52px",
              display: "flex", flexDirection: "column",
            }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
                <img src="/trilo-mark.png" alt="" style={{ height: 52, objectFit: "contain" }} />
                <span style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px" }}>TriloLift</span>
              </div>

              <label style={{ fontSize: 19, fontWeight: 700, color: "#1a1a1a", marginBottom: 9 }}>Username</label>
              <input
                style={FIELD} placeholder="Enter Username" value={username}
                onChange={(e) => { setUsername(e.target.value); setError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") login(); }}
              />

              <label style={{ fontSize: 19, fontWeight: 700, color: "#1a1a1a", margin: "22px 0 9px" }}>Password</label>
              <input
                style={FIELD} type="password" placeholder="Enter Password" value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") login(); }}
              />

              {error && (
                <span style={{ fontSize: 14, color: "#dc2626", fontWeight: 600, marginTop: 12 }}>
                  Invalid username or password.
                </span>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 34 }}>
                <button
                  onClick={login}
                  style={{
                    background: "#1e8e50", color: "#fff", fontWeight: 700, fontSize: 20,
                    border: "none", borderRadius: 10, padding: "15px 56px", cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(30,142,80,0.30)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#17753f"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#1e8e50"; }}
                >
                  Login
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
