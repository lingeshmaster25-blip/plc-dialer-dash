import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronUp, ChevronDown, Minus, Plus } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { addPutaway, getBinUsage } from "@/lib/inventory-store";
import { useConfig } from "@/lib/config-store";

export const Route = createFileRoute("/putaway")({
  component: PutawayPage,
});

const LABEL: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 700,
  color: "#111827", marginBottom: 2,
};

const FIELD: React.CSSProperties = {
  width: "100%", background: "#e8eaec", border: "1px solid #e2e4e7",
  borderRadius: 8, padding: "6px 12px", fontSize: 14, color: "#111827",
  outline: "none", boxSizing: "border-box",
  MozAppearance: "textfield",
} as React.CSSProperties;

/** Normalise an id to PREFIX + 3-digit number, e.g. "b1" -> "B001". */
function padId(prefix: "B" | "T", raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return prefix + digits.padStart(3, "0");
}

/** Parse the BIN ID field (space/comma separated) into distinct formatted bins. */
function parseBins(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const id = padId("B", part);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "6px 16px", fontSize: 14, fontWeight: 500,
        borderRadius: 8, cursor: "pointer",
        background: active ? "#3f3f3f" : "#fff",
        border: active ? "1.5px solid #3f3f3f" : "1px solid #d0d4da",
        color: active ? "#fff" : "#111827",
        transition: "all .12s",
      }}
    >
      {label}
    </button>
  );
}

const segBtn: React.CSSProperties = {
  width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#fff", border: "none", cursor: "pointer", color: "#374151",
};

function SegDim({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #d0d4da", borderRadius: 8, overflow: "hidden" }}>
        <button onClick={() => onChange(value - 1)} style={segBtn}><Minus size={15} /></button>
        <span style={{ width: 30, textAlign: "center", fontSize: 15, fontWeight: 700, color: "#111827" }}>{value}</span>
        <button onClick={() => onChange(value + 1)} style={segBtn}><Plus size={15} /></button>
      </div>
    </div>
  );
}

function TrayBlocks({ trays, selected, onToggle }: {
  trays: { name: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
      {trays.map((tray) => {
        const id = `tray-${tray.name}`;
        const green = selected.has(id);
        return (
          <div key={tray.name} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: "#1f2937", marginBottom: 8, flexShrink: 0 }}>
              {tray.name}
            </span>
            <div
              onClick={() => onToggle(id)}
              style={{
                flex: 1, minHeight: 0, borderRadius: 12, cursor: "pointer",
                background: green ? "#b5f09c" : "#fff",
                border: green ? "1px solid rgba(0,0,0,0.08)" : "1px solid #d0d4da",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)", transition: "background .12s",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function BinCell({ green, onClick }: { green: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, minWidth: 0, minHeight: 0, cursor: "pointer",
        background: green ? "#b5f09c" : "#c5c5c5",
        border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10,
        boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
        padding: "12px 14px", transition: "background .12s",
      }}
    >
      <span style={{ fontSize: 19, fontWeight: 600, color: "#1f2937" }}>B1</span>
    </div>
  );
}

function BinTrays({ trays, binsPerTray, selected, onToggle }: {
  trays: { name: string }[];
  binsPerTray: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
      {trays.map((tray) => (
        <div key={tray.name} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 22, fontWeight: 500, color: "#1f2937", marginBottom: 8, flexShrink: 0 }}>
            {tray.name}
          </span>
          <div style={{
            flex: 1, minHeight: 0, display: "flex", gap: 14, alignItems: "stretch",
            background: "#fff", border: "1px solid #d0d4da", borderRadius: 12,
            padding: 14, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}>
            {Array.from({ length: binsPerTray }).map((_, i) => {
              const id = `${tray.name}-bin-${i}`;
              return <BinCell key={i} green={selected.has(id)} onClick={() => onToggle(id)} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Matrix of segments for a Bin / Multi putaway, sized by the entered rows x cols. */
function SegmentGrid({ rows, cols, selected, onToggle }: {
  rows: number; cols: number; selected: Set<string>; onToggle: (id: string) => void;
}) {
  const cells = Array.from({ length: rows * cols });
  return (
    <div style={{
      flex: 1, marginTop: 14, minHeight: 0,
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: 1.5, background: "#9aa1a9",
      border: "1.5px solid #9aa1a9", borderRadius: 8, overflow: "hidden",
    }}>
      {cells.map((_, i) => {
        const id = `seg-${i}`;
        const green = selected.has(id);
        return (
          <div key={i} onClick={() => onToggle(id)} style={{
            background: green ? "#b5f09c" : "#c5c5c5",
            padding: "12px 14px", cursor: "pointer", transition: "background .12s",
            display: "flex", alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: "#1f2937" }}>S{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

function PutawayPage() {
  const cfg = useConfig();
  const [storingType, setStoringType] = useState<"Tray" | "Bin" | null>(null);
  const [partition, setPartition] = useState<"Single" | "Multi" | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [sku, setSku] = useState("");
  const [skuDesc, setSkuDesc] = useState("");
  const [binId, setBinId] = useState("");
  const [trayId, setTrayId] = useState("");
  const [segRows, setSegRows] = useState(2);
  const [segCols, setSegCols] = useState(2);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [capacityWarn, setCapacityWarn] = useState<null | { bin: string; usage: number; projected: number }>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isMultiBin = storingType === "Bin" && partition === "Multi";

  const toggleSeg = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Constrain the matrix to a maximum of 2x3 or 3x2 (max 6 segments, no 3x3).
  const setRowsClamped = (v: number) => {
    const r = Math.max(1, Math.min(3, v));
    setSegRows(r);
    if (r * segCols > 6) setSegCols(Math.max(1, Math.floor(6 / r)));
  };
  const setColsClamped = (v: number) => {
    const c = Math.max(1, Math.min(3, v));
    setSegCols(c);
    if (segRows * c > 6) setSegRows(Math.max(1, Math.floor(6 / c)));
  };

  const binList = parseBins(binId);
  const trayFmt = padId("T", trayId);

  const isComplete =
    sku.trim() !== "" && qty > 0 && skuDesc.trim() !== "" &&
    storingType !== null && partition !== null &&
    binList.length > 0 && trayFmt !== "";

  /** Write a record per bin and show the success modal. */
  const commitPutaway = () => {
    const tray = padId("T", trayId);
    parseBins(binId).forEach((b) => {
      addPutaway({
        sku, description: skuDesc, qty,
        storingType: storingType!, partition: partition!,
        binId: b, trayId: tray, bins: [...selected],
      });
    });
    setCapacityWarn(null);
    setShowModal(true);
  };

  const handleKeep = () => {
    if (!isComplete) { setError(true); return; }
    setError(false);
    // Capacity cross-check per bin: would any target bin go over its limit?
    for (const b of parseBins(binId)) {
      const usage = getBinUsage(b);
      if (usage + qty > cfg.binCapacity) {
        setCapacityWarn({ bin: b, usage, projected: usage + qty });
        return;
      }
    }
    commitPutaway();
  };

  const handleOkay = () => {
    setShowModal(false);
    setCapacityWarn(null);
    setSku("");
    setQty(0);
    setSkuDesc("");
    setStoringType(null);
    setPartition(null);
    setBinId("");
    setTrayId("");
    setSegRows(2);
    setSegCols(2);
    setError(false);
    setSelected(new Set());
  };

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Header */}
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Putaway Overview
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>
          Store Items into the module
        </p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0 10px", flexShrink: 0 }} />

        {/* Two columns: form | preview */}
        <div style={{ display: "flex", gap: 32, alignItems: "stretch", flex: 1, minHeight: 0 }}>

          {/* ── FORM ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>

            {/* SKUs + Quantity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={LABEL}>SKUs</label>
                <input style={FIELD} placeholder="Enter SKU or Scan SKU"
                  value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div>
                <label style={LABEL}>Quantity</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={FIELD}
                    type="text"
                    inputMode="numeric"
                    placeholder="Qty"
                    value={qty === 0 ? "" : qty}
                    onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setQty(v === "" ? 0 : parseInt(v, 10)); }}
                  />
                  <div style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    display: "flex", flexDirection: "column",
                  }}>
                    <ChevronUp size={16} color="#374151" style={{ cursor: "pointer" }}
                      onClick={() => setQty((q) => q + 1)} />
                    <ChevronDown size={16} color="#374151" style={{ cursor: "pointer" }}
                      onClick={() => setQty((q) => Math.max(0, q - 1))} />
                  </div>
                </div>
              </div>
            </div>

            {/* SKU Description */}
            <div>
              <label style={LABEL}>SKU Description</label>
              <input style={FIELD} placeholder="Enter SKU description"
                value={skuDesc} onChange={(e) => setSkuDesc(e.target.value)} />
            </div>

            {/* Choose Storing Type */}
            <div>
              <label style={LABEL}>Choose Storing Type</label>
              <div style={{ display: "flex", gap: 20 }}>
                <Toggle label="Tray" active={storingType === "Tray"} onClick={() => setStoringType("Tray")} />
                <Toggle label="Bin" active={storingType === "Bin"} onClick={() => setStoringType("Bin")} />
              </div>
            </div>

            {/* Partition Type */}
            <div>
              <label style={LABEL}>Partition Type</label>
              <div style={{ display: "flex", gap: 20 }}>
                <Toggle label="Single" active={partition === "Single"} onClick={() => setPartition("Single")} />
                <Toggle label="Multi" active={partition === "Multi"} onClick={() => setPartition("Multi")} />
              </div>
            </div>

            {/* BIN ID + TRAY ID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={LABEL}>BIN ID</label>
                <input style={FIELD} placeholder="B001"
                  value={binId}
                  onChange={(e) => setBinId(e.target.value)}
                  onBlur={() => setBinId(parseBins(binId).join(", "))} />
                <span style={{ display: "block", fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>
                  Space-separate for multiple bins (B001 B002)
                </span>
              </div>
              <div>
                <label style={LABEL}>TRAY ID</label>
                <input style={FIELD} placeholder="T001"
                  value={trayId}
                  onChange={(e) => setTrayId(e.target.value)}
                  onBlur={() => setTrayId(padId("T", trayId))} />
              </div>
            </div>

            {/* Segments (Bin + Multi only) */}
            {isMultiBin && (
              <div>
                <label style={LABEL}>Segments</label>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <SegDim value={segRows} onChange={setRowsClamped} label="Rows" />
                  <span style={{ fontSize: 18, fontWeight: 600, color: "#6b7280", alignSelf: "flex-end", paddingBottom: 6 }}>×</span>
                  <SegDim value={segCols} onChange={setColsClamped} label="Columns" />
                  <span style={{ fontSize: 12.5, color: "#9ca3af", alignSelf: "flex-end", paddingBottom: 8, marginLeft: 4 }}>
                    max 2×3 or 3×2
                  </span>
                </div>
              </div>
            )}

            {/* KEEP (bottom-right of the form) */}
            <div style={{ marginTop: "auto", paddingTop: 4, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {error && (
                <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                  Please fill in all fields and select both types.
                </span>
              )}
              <button
                onClick={handleKeep}
                style={{
                  background: "#15803d", color: "#fff", fontWeight: 700, fontSize: 16,
                  letterSpacing: "1px", border: "none", borderRadius: 8,
                  padding: "9px 0", width: 210, cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(21,128,61,0.3)", transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#13702f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#15803d"; }}
              >
                KEEP
              </button>
            </div>
          </div>

          {/* ── STORAGE PREVIEW ── */}
          <div style={{
            flex: 1, minWidth: 0, border: "1px solid #d0d4da", borderRadius: 10,
            padding: "18px 22px", display: "flex", flexDirection: "column",
          }}>
            <span style={{ fontSize: 19, fontWeight: 600, color: "#1a1a1a" }}>Storage Preview</span>

            {isMultiBin ? (
              <SegmentGrid rows={segRows} cols={segCols} selected={selected} onToggle={toggleSeg} />
            ) : storingType === "Bin" && partition === "Single" ? (
              <BinTrays
                binsPerTray={4}
                trays={[{ name: "Tray1" }, { name: "Tray2" }]}
                selected={selected}
                onToggle={toggleSeg}
              />
            ) : storingType === "Tray" && partition === "Single" ? (
              <TrayBlocks
                trays={[{ name: "Tray1" }, { name: "Tray2" }]}
                selected={selected}
                onToggle={toggleSeg}
              />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
                <span style={{ fontSize: 26, color: "#6b7280" }}>No Preview Selected</span>
              </div>
            )}
          </div>

        </div>

        {/* ── CAPACITY WARNING MODAL ── */}
        {capacityWarn && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)",
            borderRadius: 10,
          }}>
            <div style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(11px)", WebkitBackdropFilter: "blur(11px)",
              borderRadius: 26, boxShadow: "0 24px 70px rgba(0,0,0,0.20)",
              border: "1px solid rgba(219,0,0,0.35)",
              padding: 44, boxSizing: "border-box",
              width: "min(720px, 90%)", maxHeight: "88%",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
            }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: "#b91c1c", textAlign: "center" }}>
                Bin Over Capacity
              </span>
              <span style={{ fontSize: 19, fontWeight: 500, color: "#1a1a1a", textAlign: "center", lineHeight: 1.4 }}>
                Bin <b>{capacityWarn.bin}</b> holds {capacityWarn.usage} of {cfg.binCapacity} units.
                Adding {qty} would bring it to {capacityWarn.projected}, over the {cfg.binCapacity}-unit limit.
              </span>
              <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
                <button
                  onClick={() => setCapacityWarn(null)}
                  style={{
                    background: "#fff", color: "#1f2937", fontSize: 18, fontWeight: 600,
                    border: "1px solid #d0d4da", borderRadius: 12, padding: "13px 40px", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={commitPutaway}
                  style={{
                    background: "#db0000", color: "#fff", fontSize: 18, fontWeight: 600,
                    border: "none", borderRadius: 12, padding: "13px 40px", cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(219,0,0,0.35)", transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#b00000"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#db0000"; }}
                >
                  Store Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONFIRMATION MODAL ── */}
        {showModal && (
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
                The Items have been allocated in the designated bin/tray
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
