import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { usePutawayRecords } from "@/lib/inventory-store";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

type FilterTab = "All" | "SKU" | "Bin" | "Tray" | "Order";

// Extended seed data to match the reference screenshot
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  "In Stock": { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
  "Inbound":  { background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db" },
  "Low":      { background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a" },
};

const TH: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: "#6b7280",
  letterSpacing: "0.5px", textAlign: "left",
};

const COL = "110px 1fr 160px 180px 160px";

export default function SearchPage() { return <SearchPage2 />; }

function SearchPage2() {
  const records = usePutawayRecords();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("All");

  // Rows come only from real putaway records in the store.
  const allRows = useMemo(() => {
    return records.map((r) => ({
      sku: r.sku,
      description: r.description,
      tray: r.trayId.replace("Tray ", "T-").replace("T-T", "T-"),
      bin:  r.binId.replace("Bin ", "B").replace("BB", "B"),
      qty: r.qty,
      status: r.qty <= 0 ? "Low" : "In Stock" as string,
    }));
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (tab === "SKU"   && !row.sku.toLowerCase().includes(q)) return false;
      if (tab === "Bin"   && !row.bin.toLowerCase().includes(q)) return false;
      if (tab === "Tray"  && !row.tray.toLowerCase().includes(q)) return false;
      if (tab === "Order") return false; // orders not in inventory store
      if (q === "") return true;
      return (
        row.sku.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.bin.toLowerCase().includes(q) ||
        row.tray.toLowerCase().includes(q)
      );
    });
  }, [allRows, query, tab]);

  const TABS: FilterTab[] = ["All", "SKU", "Bin", "Tray", "Order"];

  return (
    <DashboardShell>
      <div style={{
        flex: 1, minWidth: 0, overflow: "hidden",
        padding: "22px 32px",
        display: "flex", flexDirection: "column",
      }}>

        {/* Header */}
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Search Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>
          Find items across trays, bins and orders
        </p>

        <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0 16px", flexShrink: 0 }} />

        {/* Search bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexShrink: 0 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by SKU, name, bin, tray or order"
            style={{
              flex: 1, height: 44, borderRadius: 8,
              border: "1.5px solid #d1d5db", outline: "none",
              padding: "0 16px", fontSize: 15, color: "#374151",
              background: "#f9fafb",
            }}
            onFocus={(e)  => { e.currentTarget.style.borderColor = "#2563eb"; }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = "#d1d5db"; }}
          />
          <button
            onClick={() => {/* query state already reactive */}}
            style={{
              height: 44, padding: "0 28px", borderRadius: 8,
              background: "#2563eb", color: "#fff", fontSize: 15,
              fontWeight: 600, border: "none", cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; }}
          >
            Search
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexShrink: 0 }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 22px", borderRadius: 7, border: "1.5px solid #d1d5db",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                background: tab === t ? "#1a1a1a" : "#fff",
                color: tab === t ? "#fff" : "#374151",
                transition: "all .12s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          flex: 1, minHeight: 0,
          border: "1.5px solid #e5e7eb", borderRadius: 12,
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: COL,
            padding: "10px 20px", borderBottom: "1.5px solid #e5e7eb",
            background: "#fff", flexShrink: 0,
          }}>
            <span style={TH}>SKU</span>
            <span style={TH}>ITEM</span>
            <span style={TH}>LOCATION</span>
            <span style={TH}>AVAILABLE QUANTITY</span>
            <span style={TH}>STATUS</span>
          </div>

          {/* Body */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100%", color: "#9ca3af", fontSize: 15,
              }}>
                No results found
              </div>
            ) : (
              filtered.map((row, i) => (
                <div
                  key={row.sku + i}
                  style={{
                    display: "grid", gridTemplateColumns: COL,
                    padding: "12px 20px",
                    borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: "#fff",
                    cursor: "pointer",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                >
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{row.sku}</span>
                  <span style={{ fontSize: 14, color: "#374151" }}>{row.description}</span>
                  <span style={{ fontSize: 14, color: "#374151" }}>
                    {row.tray} · {row.bin}
                  </span>
                  <span style={{ fontSize: 14, color: "#374151" }}>{row.qty}</span>
                  <span>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                      ...(STATUS_STYLE[row.status] ?? STATUS_STYLE["In Stock"]),
                    }}>
                      {row.status}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
