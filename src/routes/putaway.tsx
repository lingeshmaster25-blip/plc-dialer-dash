import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Minus, Plus, Upload, FileDown, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

import { DashboardShell } from "@/components/DashboardShell";
import { addPutaway, getBinUsage } from "@/lib/inventory-store";
import { addOrder, type Priority } from "@/lib/orders-store";
import { useConfig } from "@/lib/config-store";

export const Route = createFileRoute("/putaway")({
  component: PutawayPage,
});

const LABEL: React.CSSProperties = {
  display: "block", fontSize: 14, fontWeight: 700,
  color: "#111827", marginBottom: 5,
};

const FIELD: React.CSSProperties = {
  width: "100%", background: "#e8eaec", border: "1px solid #e2e4e7",
  borderRadius: 8, padding: "9px 14px", fontSize: 14, color: "#111827",
  outline: "none", boxSizing: "border-box",
  MozAppearance: "textfield",
} as React.CSSProperties;

/** Normalise an id to PREFIX + 3-digit number, e.g. "b1" -> "B001". */
const BIN_MAX = 55;
const TRAY_MAX = 11;

/** Minimal CSV parser: handles quoted fields, commas, and CRLF/LF. Returns row objects keyed by header. */
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
      return obj;
    });
}

/** Convert an Excel workbook (first sheet) into the same row-object shape as parseCSV. */
function parseExcel(buffer: ArrayBuffer): Record<string, string>[] {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return [];
  const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: "" });
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => String(h ?? "").trim());
  return rows.slice(1)
    .filter((r) => r.some((v) => String(v ?? "").trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = String(r[i] ?? "").trim(); });
      return obj;
    });
}

const isExcelFile = (file: File) => {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xlsm");
};


function padId(prefix: "B" | "T", raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const n = Number(digits);
  const max = prefix === "B" ? BIN_MAX : TRAY_MAX;
  if (n < 1 || n > max) return ""; // out of range → rejected
  return prefix + String(n).padStart(3, "0");
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

/** Map an internal preview-cell id (seg-N or Tray-bin-N) to its bin label (B1, B2, …). */
function binLabelFromId(id: string): string | null {
  if (id.startsWith("seg-")) return `B${Number(id.slice(4)) + 1}`;
  const m = id.match(/-bin-(\d+)$/);
  if (m) return `B${Number(m[1]) + 1}`;
  return null;
}

/** Parse the TRAY ID field (space/comma separated) into distinct formatted trays. */
function parseTrays(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const id = padId("T", part);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/** Map a preview-cell id to its tray number (tray-Tray1 or Tray1-bin-N). */
function trayNumFromId(id: string): number | null {
  let trayPart: string | null = null;
  if (id.startsWith("tray-")) trayPart = id.slice(5);
  else if (id.includes("-bin-")) trayPart = id.split("-bin-")[0];
  if (!trayPart) return null;
  const m = trayPart.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "9px 16px", fontSize: 15, fontWeight: 500,
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
  width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#fff", border: "none", cursor: "pointer", color: "#374151",
};

function SegDim({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #d0d4da", borderRadius: 8, overflow: "hidden" }}>
        <button onClick={() => onChange(value - 1)} style={segBtn}><Minus size={15} /></button>
        <span style={{ width: 32, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#111827" }}>{value}</span>
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

function BinCell({ label, green, onClick }: { label: string; green: boolean; onClick: () => void }) {
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
      <span style={{ fontSize: 19, fontWeight: 600, color: "#1f2937" }}>{label}</span>
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
              return <BinCell key={i} label={`B${i + 1}`} green={selected.has(id)} onClick={() => onToggle(id)} />;
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
            <span style={{ fontSize: 18, fontWeight: 600, color: "#1f2937" }}>B{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

function PutawayPage() {
  const cfg = useConfig();
  const navigate = useNavigate();
  const [storingType, setStoringType] = useState<"Tray" | "Bin" | null>(null);
  const [partition, setPartition] = useState<"Single" | "Multi" | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [sku, setSku] = useState("");
  const [skuDesc, setSkuDesc] = useState("");
  const [binId, setBinId] = useState("");
  const [trayId, setTrayId] = useState("");
  const [multiTray, setMultiTray] = useState<number | null>(null);
  const bulkRef = useRef<HTMLInputElement>(null);
  const [bulkResult, setBulkResult] = useState<null | { created: number; skipped: string[] }>(null);
  const [segRows, setSegRows] = useState(2);
  const [segCols, setSegCols] = useState(2);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [capacityWarn, setCapacityWarn] = useState<null | { bin: string; usage: number; projected: number }>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isMultiBin = storingType === "Bin" && partition === "Multi";

  // Barcode scanner acts as a keyboard: keep the SKU field focused so a scan lands there.
  const skuRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  useEffect(() => { skuRef.current?.focus(); }, []);

  // Bin ids selected in the preview (B1, B2, …), reflected into the BIN ID field.
  const selectedBins = Array.from(selected)
    .map(binLabelFromId)
    .filter((x): x is string => x !== null);

  useEffect(() => {
    // Reflect the current preview selection into the BIN ID field,
    // and clear it when every bin is deselected.
    setBinId(selectedBins.join(" "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Tray(s) that the selected cells belong to, reflected into the TRAY ID field.
  const selectedTrays = Array.from(
    new Set(Array.from(selected).map(trayNumFromId).filter((n): n is number => n !== null))
  ).sort((a, b) => a - b).map((n) => padId("T", String(n)));

  useEffect(() => {
    // Segments (Bin + Multi) carry no tray, so leave TRAY ID manual there.
    if (isMultiBin) return;
    setTrayId(selectedTrays.join(" "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, isMultiBin]);

  const toggleSeg = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      // Only 1 tray can be called per cycle → tray selection is single.
      if (id.startsWith("tray-")) {
        Array.from(next).forEach((x) => { if (x.startsWith("tray-")) next.delete(x); });
        next.add(id);
        return next;
      }
      // Only 5 bins can be called per cycle.
      const binCount = Array.from(next).filter((x) => !x.startsWith("tray-")).length;
      if (binCount >= 5) return prev;
      next.add(id);
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
  const trayList = parseTrays(trayId);

  const isComplete =
    sku.trim() !== "" && qty > 0 && skuDesc.trim() !== "" &&
    storingType !== null && partition !== null &&
    binList.length > 0 && trayList.length > 0;

  /** Write a record per bin and show the success modal. */
  const commitPutaway = () => {
    const tray = parseTrays(trayId).join(", ");
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
    setMultiTray(null);
    setSegRows(2);
    setSegCols(2);
    setError(false);
    setSelected(new Set());
    setTimeout(() => skuRef.current?.focus(), 0);
  };

  // ── Bulk upload: each CSV row becomes a Queued order ──
  const onBulkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    try {
      const rows = parseCSV(await file.text());
      let created = 0;
      const skipped: string[] = [];
      rows.forEach((r, i) => {
        const pick = (...names: string[]) => {
          for (const key of Object.keys(r)) {
            if (names.includes(key.trim().toLowerCase())) return String(r[key] ?? "").trim();
          }
          return "";
        };
        const sku = pick("sku");
        const item = pick("item", "description", "name", "product");
        const bin = pick("bin", "bin id", "binid");
        const qty = Number(pick("qty", "quantity")) || 0;
        const emp = pick("employee", "emp", "operator") || "—";
        const pr = pick("priority").toLowerCase();
        const priority: Priority = pr.startsWith("h") ? "High" : pr.startsWith("l") ? "Low" : "Medium";
        if (!sku || qty <= 0) { skipped.push(`Row ${i + 2}`); return; }
        addOrder(emp, priority, [{ sku, item, bin, qty }]);
        created++;
      });
      setBulkResult({ created, skipped });
    } catch {
      setBulkResult({ created: 0, skipped: ["Could not read the file — please use the CSV template format."] });
    }
  };

  const downloadTemplate = () => {
    const csv = [
      "SKU,Item,Bin,Qty,Employee,Priority",
      "SKU-1001,Widget A,B001,10,John,High",
      "SKU-1002,Widget B,B002,5,John,Medium",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "putaway-orders-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
              Putaway Overview
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "3px 0 0" }}>
              Store Items into the module
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={downloadTemplate}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #d0d4da", borderRadius: 8, padding: "9px 14px", fontSize: 13.5, fontWeight: 600, color: "#374151", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f6f8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
            >
              <FileDown size={16} /> Template
            </button>
            <button
              onClick={() => bulkRef.current?.click()}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#0058f1", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13.5, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,88,241,0.28)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0049c9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0058f1"; }}
            >
              <Upload size={16} /> Bulk Upload
            </button>
            <input ref={bulkRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={onBulkFile} />
          </div>
        </div>
        <div style={{ height: 1, background: "#e5e7eb", margin: "11px 0 14px", flexShrink: 0 }} />

        {/* Two columns: form | preview */}
        <div style={{ display: "flex", gap: 32, alignItems: "stretch", flex: 1, minHeight: 0 }}>

          {/* ── FORM ── */}
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>

            {/* form fields (compact; KEEP stays pinned below) */}
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: 10, justifyContent: "space-between" }}>

            {/* SKUs + Quantity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={LABEL}>SKUs</label>
                <input ref={skuRef} style={FIELD} placeholder="Enter SKU or Scan SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); qtyRef.current?.focus(); } }} />
              </div>
              <div>
                <label style={LABEL}>Quantity</label>
                <div style={{ position: "relative" }}>
                  <input
                    ref={qtyRef}
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

            {/* Storing Type + Partition Type (side by side) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={LABEL}>Choose Storing Type</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <Toggle label="Tray" active={storingType === "Tray"} onClick={() => setStoringType("Tray")} />
                  <Toggle label="Bin" active={storingType === "Bin"} onClick={() => setStoringType("Bin")} />
                </div>
              </div>
              <div>
                <label style={LABEL}>Partition Type</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <Toggle label="Single" active={partition === "Single"} onClick={() => setPartition("Single")} />
                  <Toggle label="Multi" active={partition === "Multi"} onClick={() => setPartition("Multi")} />
                </div>
              </div>
            </div>

            {/* BIN ID + TRAY ID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={LABEL}>BIN ID</label>
                <input style={FIELD} placeholder="B001"
                  value={binId}
                  onChange={(e) => setBinId(e.target.value.replace(/[^bB0-9,\s]/g, "").toUpperCase())}
                  onBlur={() => setBinId(parseBins(binId).join(", "))} />
                <span style={{ display: "block", fontSize: 11.5, color: "#9ca3af", marginTop: 4 }}>
                  Space-separate for multiple bins (B001 B002)
                </span>
              </div>
              <div>
                <label style={LABEL}>TRAY ID</label>
                <input style={FIELD} placeholder="T001"
                  value={trayId}
                  onChange={(e) => setTrayId(e.target.value.replace(/[^tT0-9,\s]/g, "").toUpperCase())}
                  onBlur={() => setTrayId(parseTrays(trayId).join(", "))} />
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
            </div>

            {/* KEEP (always-visible footer) */}
            <div style={{ flexShrink: 0, paddingTop: 12, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <span style={{ fontSize: 19, fontWeight: 600, color: "#1a1a1a" }}>Storage Preview</span>
              <span style={{
                marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, color: "#374151",
              }}>
                Selected Bin:
                <span style={{
                  background: selectedBins.length ? "#b5f09c" : "#eef0f3",
                  color: selectedBins.length ? "#166534" : "#9ca3af",
                  borderRadius: 999, padding: "3px 12px", fontWeight: 700,
                }}>
                  {selectedBins.length ? selectedBins.join(", ") : "None"}
                </span>
              </span>
            </div>

            {isMultiBin ? (
              <>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Tray</span>
                  <div style={{ position: "relative" }}>
                    <select
                      value={multiTray ?? ""}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null;
                        setMultiTray(v);
                        setTrayId(v ? padId("T", String(v)) : "");
                      }}
                      style={{
                        appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                        background: "#fff", border: "1px solid #d0d4da", borderRadius: 8,
                        padding: "8px 34px 8px 12px", fontSize: 14, fontWeight: 600, color: "#1a1a1a",
                        cursor: "pointer", outline: "none",
                      }}
                    >
                      <option value="">Select tray</option>
                      {Array.from({ length: cfg.totalTrays }).map((_, i) => (
                        <option key={i} value={i + 1}>Tray {i + 1}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#374151" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                </div>
                <SegmentGrid rows={segRows} cols={segCols} selected={selected} onToggle={toggleSeg} />
              </>
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

        {bulkResult && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 60,
            background: "rgba(255,255,255,0.42)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "min(460px, 90%)", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
              boxShadow: "0 20px 60px rgba(16,24,40,0.25)", padding: "28px 32px", textAlign: "center",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <CheckCircle2 size={52} color="#28954b" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>
                {bulkResult.created} {bulkResult.created === 1 ? "order" : "orders"} created
              </div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
                {bulkResult.created > 0
                  ? "Added to the Orders queue."
                  : "No orders were created."}
              </div>
              {bulkResult.skipped.length > 0 && (
                <div style={{ fontSize: 13, color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 12px", marginTop: 14 }}>
                  Skipped {bulkResult.skipped.length}: {bulkResult.skipped.join(", ")}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22 }}>
                <button
                  onClick={() => setBulkResult(null)}
                  style={{ background: "#fff", border: "1px solid #d0d4da", borderRadius: 10, padding: "12px 26px", fontSize: 15, fontWeight: 600, color: "#374151", cursor: "pointer" }}
                >
                  Close
                </button>
                {bulkResult.created > 0 && (
                  <button
                    onClick={() => { setBulkResult(null); navigate({ to: "/orders" }); }}
                    style={{ background: "#0058f1", border: "none", borderRadius: 10, padding: "12px 26px", fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 3px 10px rgba(0,88,241,0.3)" }}
                  >
                    View Orders
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
