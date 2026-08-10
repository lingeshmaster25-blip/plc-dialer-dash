import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneCall, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";

import { DashboardShell } from "@/components/DashboardShell";
import { hmiApi } from "@/lib/hmi-api";
import { useConfig } from "@/lib/config-store";

export const Route = createFileRoute("/testing")({
  component: TestingPage,
});

const MAX_BINS_PER_CALL = 5; // DB_Input_BIN1..BIN5 — the PLC only has 5 stage slots
const BIN_SLOT_TAGS = ["DB_Input_BIN1", "DB_Input_BIN2", "DB_Input_BIN3", "DB_Input_BIN4", "DB_Input_BIN5"];
const PULSE_MS = 500;

type Toast = { tone: "ok" | "err"; text: string } | null;

function Grid({
  count,
  selected,
  isSelectable,
  onToggle,
}: {
  count: number;
  selected: number[];
  isSelectable: (n: number) => boolean;
  onToggle: (n: number) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))",
        gap: 8,
      }}
    >
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
        const isSel = selected.includes(n);
        const order = isSel ? selected.indexOf(n) + 1 : null;
        const disabled = !isSel && !isSelectable(n);
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(n)}
            title={isSel ? `Selected — slot ${order}` : disabled ? "Selection limit reached" : `Select ${n}`}
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Inter','Segoe UI',sans-serif",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "transform .1s, box-shadow .12s",
              background: isSel ? "#0058f1" : disabled ? "#f1f2f4" : "#fff",
              color: isSel ? "#fff" : disabled ? "#c2c5cb" : "#111827",
              border: isSel ? "1.5px solid #0058f1" : "1px solid #dfe2e6",
              boxShadow: isSel ? "0 3px 10px rgba(0,88,241,0.28)" : "0 1px 2px rgba(16,24,40,0.04)",
            }}
            onMouseEnter={(e) => { if (!disabled && !isSel) e.currentTarget.style.borderColor = "#0058f1"; }}
            onMouseLeave={(e) => { if (!disabled && !isSel) e.currentTarget.style.borderColor = "#dfe2e6"; }}
          >
            {n}
            {isSel && order && (
              <span
                style={{
                  position: "absolute", top: -6, right: -6, width: 18, height: 18,
                  borderRadius: "50%", background: "#111827", color: "#fff",
                  fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center",
                  justifyContent: "center", border: "2px solid #fff",
                }}
              >
                {order}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TestingPage() {
  const cfg = useConfig();
  const [selectedBins, setSelectedBins] = useState<number[]>([]);
  const [selectedTray, setSelectedTray] = useState<number | null>(null);
  const [binCalling, setBinCalling] = useState(false);
  const [trayCalling, setTrayCalling] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);

  const flash = (t: Toast) => {
    setToast(t);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const toggleBin = (n: number) => {
    setSelectedBins((prev) => {
      if (prev.includes(n)) return prev.filter((b) => b !== n);
      if (prev.length >= MAX_BINS_PER_CALL) return prev; // hard cap — ignore extra picks
      return [...prev, n];
    });
  };

  const toggleTray = (n: number) => {
    setSelectedTray((prev) => (prev === n ? null : n)); // single-select
  };

  const clearBins = () => setSelectedBins([]);
  const clearTray = () => setSelectedTray(null);

  const callBins = async () => {
    if (selectedBins.length < 1 || selectedBins.length > MAX_BINS_PER_CALL) {
      flash({ tone: "err", text: `Select 1 to ${MAX_BINS_PER_CALL} bins before calling.` });
      return;
    }
    setBinCalling(true);
    try {
      for (let i = 0; i < MAX_BINS_PER_CALL; i++) {
        await hmiApi.writeTag(BIN_SLOT_TAGS[i], selectedBins[i] ?? 0);
      }
      await hmiApi.writeTag("Bin_Call", true);
      window.setTimeout(() => { hmiApi.writeTag("Bin_Call", false).catch(() => {}); }, PULSE_MS);
      flash({ tone: "ok", text: `Called bin${selectedBins.length > 1 ? "s" : ""} ${selectedBins.join(", ")}.` });
    } catch (e) {
      flash({ tone: "err", text: `Bin call failed: ${(e as Error).message}` });
    } finally {
      setBinCalling(false);
    }
  };

  const callTray = async () => {
    if (selectedTray == null) {
      flash({ tone: "err", text: "Select a tray before calling." });
      return;
    }
    setTrayCalling(true);
    try {
      await hmiApi.writeTag("Tray_Input", selectedTray);
      await hmiApi.writeTag("Tray_Call", true);
      window.setTimeout(() => { hmiApi.writeTag("Tray_Call", false).catch(() => {}); }, PULSE_MS);
      flash({ tone: "ok", text: `Called tray ${selectedTray}.` });
    } catch (e) {
      flash({ tone: "err", text: `Tray call failed: ${(e as Error).message}` });
    } finally {
      setTrayCalling(false);
    }
  };

  const binCallDisabled = binCalling || selectedBins.length < 1 || selectedBins.length > MAX_BINS_PER_CALL;
  const trayCallDisabled = trayCalling || selectedTray == null;

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Testing
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
          Manually call bins &amp; trays for testing — up to {MAX_BINS_PER_CALL} bins per call, one tray at a time.
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 16px", flexShrink: 0 }} />

        <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 24, overflow: "hidden" }}>

          {/* Bins panel */}
          <div style={{
            flex: 1.4, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 16,
            boxShadow: "0 1px 4px rgba(16,24,40,0.06)", padding: "18px 22px",
            display: "flex", flexDirection: "column", minHeight: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>Bins</span>
              <span style={{
                marginLeft: 10, background: "#eef0f3", color: "#374151",
                fontSize: 12.5, fontWeight: 600, borderRadius: 999, padding: "3px 10px",
              }}>
                {cfg.totalBins} total
              </span>
              <span style={{
                marginLeft: "auto", fontSize: 12.5, fontWeight: 700,
                color: selectedBins.length > 0 ? "#0058f1" : "#9ca3af",
              }}>
                {selectedBins.length} / {MAX_BINS_PER_CALL} selected
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#9ca3af", margin: "0 0 14px" }}>
              Pick up to {MAX_BINS_PER_CALL} bins — the order picked fills DB_Input_BIN1 → BIN{MAX_BINS_PER_CALL}.
            </p>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
              <Grid
                count={cfg.totalBins}
                selected={selectedBins}
                isSelectable={() => selectedBins.length < MAX_BINS_PER_CALL}
                onToggle={toggleBin}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16, flexShrink: 0 }}>
              <button
                onClick={clearBins}
                disabled={selectedBins.length === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                  background: "#fff", border: "1px solid #d0d4da", borderRadius: 10,
                  padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "#374151",
                  cursor: selectedBins.length === 0 ? "not-allowed" : "pointer",
                  opacity: selectedBins.length === 0 ? 0.5 : 1,
                }}
              >
                <RotateCcw size={15} /> Clear
              </button>
              <button
                onClick={callBins}
                disabled={binCallDisabled}
                style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                  background: binCallDisabled ? "#9db8f5" : "#0058f1", border: "none", borderRadius: 10,
                  padding: "12px 20px", fontSize: 15, fontWeight: 700, color: "#fff",
                  cursor: binCallDisabled ? "not-allowed" : "pointer",
                  boxShadow: binCallDisabled ? "none" : "0 3px 10px rgba(0,88,241,0.30)",
                }}
              >
                <PhoneCall size={16} /> {binCalling ? "Calling…" : "Call Bins"}
              </button>
            </div>
          </div>

          {/* Trays panel */}
          <div style={{
            flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 16,
            boxShadow: "0 1px 4px rgba(16,24,40,0.06)", padding: "18px 22px",
            display: "flex", flexDirection: "column", minHeight: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>Trays</span>
              <span style={{
                marginLeft: 10, background: "#eef0f3", color: "#374151",
                fontSize: 12.5, fontWeight: 600, borderRadius: 999, padding: "3px 10px",
              }}>
                {cfg.totalTrays} total
              </span>
              <span style={{
                marginLeft: "auto", fontSize: 12.5, fontWeight: 700,
                color: selectedTray != null ? "#0058f1" : "#9ca3af",
              }}>
                {selectedTray != null ? "1" : "0"} / 1 selected
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#9ca3af", margin: "0 0 14px" }}>
              Only one tray can be called at a time.
            </p>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
              <Grid
                count={cfg.totalTrays}
                selected={selectedTray != null ? [selectedTray] : []}
                isSelectable={() => true}
                onToggle={toggleTray}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16, flexShrink: 0 }}>
              <button
                onClick={clearTray}
                disabled={selectedTray == null}
                style={{
                  display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                  background: "#fff", border: "1px solid #d0d4da", borderRadius: 10,
                  padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "#374151",
                  cursor: selectedTray == null ? "not-allowed" : "pointer",
                  opacity: selectedTray == null ? 0.5 : 1,
                }}
              >
                <RotateCcw size={15} /> Clear
              </button>
              <button
                onClick={callTray}
                disabled={trayCallDisabled}
                style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                  background: trayCallDisabled ? "#9db8f5" : "#0058f1", border: "none", borderRadius: 10,
                  padding: "12px 20px", fontSize: 15, fontWeight: 700, color: "#fff",
                  cursor: trayCallDisabled ? "not-allowed" : "pointer",
                  boxShadow: trayCallDisabled ? "none" : "0 3px 10px rgba(0,88,241,0.30)",
                }}
              >
                <PhoneCall size={16} /> {trayCalling ? "Calling…" : "Call Tray"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed", bottom: 170, left: "50%", transform: "translateX(-50%)",
            zIndex: 200, display: "flex", alignItems: "center", gap: 10,
            background: toast.tone === "ok" ? "#0b6b32" : "#7f1d1d",
            border: `1.5px solid ${toast.tone === "ok" ? "#22c55e" : "#ef4444"}`,
            color: "#fff", borderRadius: 999, padding: "12px 22px", fontSize: 14, fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          {toast.tone === "ok" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          {toast.text}
        </div>
      )}
    </DashboardShell>
  );
}
