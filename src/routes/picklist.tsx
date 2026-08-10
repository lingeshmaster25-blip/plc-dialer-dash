import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useOrders, getPickingOrder, toggleItemPicked, confirmPick, releaseToPicklist } from "@/lib/orders-store";
import { pushActivity } from "@/lib/dashboard-store";
import { hmiApi } from "@/lib/hmi-api";
import { toast } from "sonner";

export const Route = createFileRoute("/picklist")({
  component: PicklistPage,
});

const TILE_COLOR = {
  now:    "#f6a656",
  queued: "#7dc0f7",
  picked: "#41cc17",
  empty:  "#c5c5c5",
} as const;

const HCELL: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: "#9098a3", letterSpacing: "0.3px" };
const ROW_COLS = "44px 1.2fr 1.3fr 0.8fr 0.6fr";

const binNum = (b: string) => parseInt(b.replace(/\D/g, ""), 10) || 0;

// ── Machine layout — SET THESE TO YOUR RACK ─────────────────────────────
// The app maps a global bin number to (tray, position-in-tray) with these.
// If your machine is not 5 bins per tray, the tray it calls will be wrong
// even when the write itself succeeds. Change only these two values.
const BINS_PER_TRAY = 5;                              // bins in one tray/rack
const TRAY_COUNT    = 11;                             // number of trays/racks
const BIN_COUNT     = TRAY_COUNT * BINS_PER_TRAY;     // total bins (derived)
const trayOfBin = (n: number) => Math.ceil(n / BINS_PER_TRAY);
const posInTray = (n: number) => ((n - 1) % BINS_PER_TRAY) + 1;

// Resolve the three values a bin call needs (SelectedBin / RackNo / RackBin).
// Returns null if the item has no usable location — the caller must NOT call
// the PLC in that case, and the Confirm button must stay disabled.
const binCallValues = (bin: string | undefined) => {
  const n = binNum(bin ?? "");
  if (n < 1) return null;
  const rackNo = trayOfBin(n);
  const rackBin = posInTray(n);
  if (rackNo < 1 || rackBin < 1 || rackBin > BINS_PER_TRAY) return null;
  return { selectedBin: n, rackNo, rackBin };
};
// ────────────────────────────────────────────────────────────────────────

function PicklistPage() {
  const navigate = useNavigate();
  useOrders(); // subscribe so component re-renders on store changes

  const order = getPickingOrder();
  const items = order?.items ?? [];

  // Picking method chosen for the current order (SKU / Tray / Bin).
  const [pickMode, setPickMode] = useState<"sku" | "tray" | "bin" | null>(null);
  // True while a call is in flight (writing values + confirming them in the PLC).
  const [calling, setCalling] = useState(false);
  // Reset the chooser whenever a different order becomes active.
  useEffect(() => { setPickMode(null); }, [order?.id]);

  // If the order is only "Released" (not yet Picking), auto-advance on first interaction
  const pickedSet = new Set(
    items.flatMap((it, i) => (it.picked ? [i] : []))
  );

  const involved   = new Set(items.map((it) => binNum(it.bin)));
  const pickedBins = new Set([...pickedSet].map((i) => binNum(items[i].bin)));
  const firstUnpicked = items.findIndex((_, i) => !pickedSet.has(i));
  const currentBin = firstUnpicked >= 0 ? binNum(items[firstUnpicked].bin) : -1;

  const tileState = (n: number): keyof typeof TILE_COLOR =>
    pickedBins.has(n) ? "picked" : n === currentBin ? "now" : involved.has(n) ? "queued" : "empty";

  // Tray-based helpers (bin n → tray = ceil(n/5)).
  const trayOf = (b: string) => trayOfBin(binNum(b));
  const involvedTrays = new Set(items.map((it) => trayOf(it.bin)));
  const pickedTrays = new Set(
    [...involvedTrays].filter((t) => items.filter((it) => trayOf(it.bin) === t).every((it) => it.picked))
  );
  const currentTray = currentBin > 0 ? trayOfBin(currentBin) : -1;
  const trayState = (t: number): keyof typeof TILE_COLOR =>
    pickedTrays.has(t) ? "picked" : t === currentTray ? "now" : involvedTrays.has(t) ? "queued" : "empty";

  // Scroll the tile strip so the active bin/tray is always visible.
  const activeTileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    activeTileRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentBin, currentTray, pickMode]);

  const handleToggle = (i: number) => {
    if (!order) return;
    // Auto-release if still in Released state
    if (order.status === "Released") releaseToPicklist(order.id);
    toggleItemPicked(order.id, i);
  };

  const allPicked = items.length > 0 && items.every((it) => it.picked);

  // Does the current target actually have the values a PLC call needs?
  // The Confirm button stays disabled until it does, so a bin can never be
  // "confirmed" (and marked picked) without a real call going out.
  const currentTarget = items[firstUnpicked] ?? items[0];
  const canCall =
    pickMode === "tray"
      ? !!currentTarget && trayOf(currentTarget.bin) >= 1
      : !!currentTarget && binCallValues(currentTarget.bin) !== null;
  const confirmDisabled = order?.status === "Completed" || !canCall || calling;

  // Write a bin's coordinates to the PLC, THEN pulse the call bit.
  // The coordinate words must land before the trigger's rising edge, so the
  // writes are awaited in order — a fire-and-forget sequence can let Bin_Call
  // reach the PLC before SelectedBin/RackNo/RackBin, and the PLC would act on
  // stale coordinates (or none). Global bin n → tray = trayOfBin(n),
  // position-in-tray = posInTray(n)  (see BINS_PER_TRAY at top of file).
  const callBinOnPlc = async (bin: string): Promise<boolean> => {
    const vals = binCallValues(bin);
    if (!vals) {
      // No values → do not touch Bin_Call. Nothing is sent to the PLC.
      toast.error("Bin not called — no location values", {
        description: "SelectedBin / RackNo / RackBin could not be resolved for this item.",
      });
      return false;
    }
    // Write the coordinate words, then pulse the call bit — the direct sequence
    // the working build used. (A read-back "verify" gate was removed: on this
    // PLC the words are consumed on the Bin_Call edge, so the read-back never
    // matched and the call was being blocked.)
    await hmiApi.writeTag("SelectedBin", vals.selectedBin);
    await hmiApi.writeTag("RackNo", vals.rackNo);
    await hmiApi.writeTag("RackBin", vals.rackBin);
    await hmiApi.writeTag("Bin_Call", true);
    window.setTimeout(() => { hmiApi.writeTag("Bin_Call", false).catch(() => {}); }, 300);
    toast.success(`Bin ${vals.selectedBin} called`, { description: `Rack ${vals.rackNo} · Pos ${vals.rackBin}` });
    return true;
  };

  // Call the PLC target based on the chosen picking method.
  // Target the CURRENT (first unpicked) item, not items[0] — otherwise every
  // confirm re-calls the first bin and later bins are never sent to the PLC.
  const callByMode = async (): Promise<boolean> => {
    const target = items[firstUnpicked] ?? items[0];
    if (!target) return false;

    try {
      if (pickMode === "tray") {
        const rackNo = trayOf(target.bin);
        if (rackNo < 1) {
          toast.error("Tray not called — no tray value for this item");
          return false;
        }
        await hmiApi.writeTag("RackNo", rackNo);                 // MW16 (visible in TIA Portal)
        await hmiApi.writeTag("Tray_Call", true);               // rising edge
        window.setTimeout(() => { hmiApi.writeTag("Tray_Call", false).catch(() => {}); }, 300);
        toast.success(`Tray ${rackNo} called`);
        return true;
      }
      // bin or sku → resolve to the bin's coordinates (returns false if no values)
      return await callBinOnPlc(target.bin);
    } catch (e) {
      // Backend reachable but the write was rejected (unknown tag / PLC not
      // connected). Surface it and report that nothing was called.
      toast.error(`Could not call ${pickMode === "tray" ? "tray" : "bin " + target.bin} on the PLC`, {
        description: (e as Error).message,
      });
      return false;
    }
  };

  const handleConfirmPick = async () => {
    if (!order || calling) return;
    // Write values → confirm they're in the PLC → pulse the call. Only if the
    // call actually fired do we complete the order.
    setCalling(true);
    let called = false;
    try {
      called = await callByMode();
    } finally {
      setCalling(false);
    }
    if (!called) return;
    const ok = confirmPick(order.id);
    if (ok) {
      pushActivity("Order Picked", `Order ${order.id} completed`);
    }
  };

  const handleRetrieveNext = () => {
    if (!order) return;
    // Scroll to / highlight next unpicked item — mark the current bin's items as picked
    const currentBinItems = items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => binNum(it.bin) === currentBin && !it.picked);
    currentBinItems.forEach(({ i }) => toggleItemPicked(order.id, i));
  };

  return (
    <DashboardShell>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "18px 32px", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
          Picklist Overview
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "4px 0 0" }}>Retrieve items</p>
        <div style={{ height: 1, background: "#e5e7eb", margin: "12px 0 10px", flexShrink: 0 }} />

        {!order ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <span style={{ fontSize: 20, color: "#6b7280" }}>No active order in the picklist queue.</span>
            <button
              onClick={() => navigate({ to: "/orders" })}
              style={{
                background: "#0058f1", color: "#fff", fontSize: 15, fontWeight: 600,
                border: "none", borderRadius: 8, padding: "11px 28px", cursor: "pointer",
              }}
            >
              Go to Orders
            </button>
          </div>
        ) : !pickMode ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>
              Choose picking method for Order {order.id}
            </span>
            <div style={{ display: "flex", gap: 22 }}>
              {([
                { id: "sku", label: "SKU", desc: "Pick by SKU" },
                { id: "tray", label: "Tray", desc: "Pick by tray" },
                { id: "bin", label: "Bin", desc: "Pick by bin" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPickMode(m.id)}
                  style={{
                    width: 190, height: 150, background: "#fff", border: "1.5px solid #d0d4da",
                    borderRadius: 16, cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: "0 2px 8px rgba(16,24,40,0.08)", transition: "all .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0058f1"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,88,241,0.18)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d0d4da"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(16,24,40,0.08)"; }}
                >
                  <span style={{ fontSize: 30, fontWeight: 800, color: "#0058f1" }}>{m.label}</span>
                  <span style={{ fontSize: 14, color: "#6b7280" }}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 10px" }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Order Picking</h2>
              <span style={{
                fontSize: 13, fontWeight: 700, color: "#0058f1", background: "#e8f0ff",
                borderRadius: 999, padding: "4px 14px", textTransform: "capitalize",
              }}>
                Picking by: {pickMode}
              </span>
              <button
                onClick={() => setPickMode(null)}
                style={{ marginLeft: "auto", background: "#fff", border: "1px solid #d0d4da", borderRadius: 8, padding: "7px 16px", fontSize: 13.5, fontWeight: 600, color: "#374151", cursor: "pointer" }}
              >
                Change
              </button>
            </div>

            {/* Tiles — bins for Bin mode, trays for Tray mode; hidden for SKU */}
            {pickMode !== "sku" && (
              <div style={{
                border: "1px solid #d8dbe0", borderRadius: 12, padding: 10, flexShrink: 0,
                boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
                overflowX: "auto", overflowY: "hidden",
              }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "nowrap", minWidth: "min-content" }}>
                  {Array.from({ length: pickMode === "tray" ? TRAY_COUNT : BIN_COUNT }).map((_, idx) => {
                    const n = idx + 1;
                    const state = pickMode === "tray" ? trayState(n) : tileState(n);
                    const prefix = pickMode === "tray" ? "T" : "B";
                    return (
                      <div key={n} ref={state === "now" ? activeTileRef : undefined} style={{
                        flex: "0 0 auto", width: pickMode === "tray" ? 110 : 92, height: 80, borderRadius: 12,
                        background: TILE_COLOR[state],
                        border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
                        padding: "8px 11px", position: "relative",
                      }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: "#1f2937" }}>{prefix}{n}</span>
                        {state === "picked" && (
                          <Check size={18} color="#fff" strokeWidth={3} style={{ position: "absolute", left: 10, bottom: 8 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order card */}
            <div style={{
              flex: 1, minHeight: 0, marginTop: 10, border: "1px solid #e5e7eb", borderRadius: 14,
              padding: "12px 22px", display: "flex", flexDirection: "column",
              boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 21, fontWeight: 800, color: "#1a1a1a" }}>Order {order.id}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600, padding: "3px 12px", borderRadius: 999,
                  background: order.status === "Completed" ? "#0a9d30" : "#b0ffc8",
                  color: order.status === "Completed" ? "#fff" : "#0a8f2e",
                }}>
                  {order.status}
                </span>
                <span style={{ fontSize: 14, color: "#6b7280" }}>{order.emp} · {order.priority}</span>
              </div>
              <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0 10px" }} />

              <div style={{ display: "flex", gap: 32, flex: 1, minHeight: 0 }}>

                {/* items table */}
                <div style={{ flex: 1.25, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "center", marginBottom: 6 }}>
                    <span />
                    <span style={HCELL}>SKU</span>
                    <span style={HCELL}>ITEMS</span>
                    <span style={HCELL}>BIN</span>
                    <span style={HCELL}>QTY</span>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                    {items.length === 0 ? (
                      <div style={{ padding: "16px 0", color: "#9ca3af", fontSize: 15 }}>No items to pick.</div>
                    ) : items.map((it, i) => (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "center",
                        padding: "5px 0",
                        opacity: it.picked ? 0.55 : 1,
                        transition: "opacity .15s",
                      }}>
                        <div
                          onClick={() => handleToggle(i)}
                          style={{
                            width: 22, height: 22, borderRadius: 6, cursor: "pointer",
                            border: "1.5px solid #c2c6cc",
                            background: it.picked ? "#41cc17" : "#f3f4f6",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {it.picked && <Check size={15} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 15, color: "#1f2937", textDecoration: it.picked ? "line-through" : "none" }}>{it.sku}</span>
                        <span style={{ fontSize: 15, color: "#1f2937", textDecoration: it.picked ? "line-through" : "none" }}>{it.item}</span>
                        <span style={{ fontSize: 15, color: "#1f2937" }}>{it.bin}</span>
                        <span style={{ fontSize: 15, color: "#1f2937" }}>{it.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* legend + actions */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {[
                      { c: TILE_COLOR.now,    label: "Pick now" },
                      { c: TILE_COLOR.queued, label: "Queued" },
                      { c: TILE_COLOR.picked, label: "Picked" },
                    ].map((l) => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 42, height: 24, borderRadius: 6, background: l.c, border: "1px solid rgba(0,0,0,0.08)", display: "block" }} />
                        <span style={{ fontSize: 15, color: "#1f2937" }}>-&nbsp; {l.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ flex: 1 }} />

                  {/* Progress indicator */}
                  {items.length > 0 && (
                    <div style={{ marginBottom: 12, fontSize: 14, color: "#6b7280" }}>
                      {pickedSet.size} of {items.length} items picked
                    </div>
                  )}

                  <button
                    onClick={handleRetrieveNext}
                    disabled={allPicked || items.length === 0}
                    style={{
                      fontSize: 15, fontWeight: 600,
                      border: "none", borderRadius: 8, padding: "11px 0", cursor: allPicked ? "not-allowed" : "pointer",
                      marginBottom: 10, transition: "background .15s",
                      background: allPicked ? "#d1d5db" : "#0058f1",
                      color: allPicked ? "#9ca3af" : "#fff",
                    }}
                    onMouseEnter={(e) => { if (!allPicked) e.currentTarget.style.background = "#0049cc"; }}
                    onMouseLeave={(e) => { if (!allPicked) e.currentTarget.style.background = "#0058f1"; }}
                  >
                    Retrieve Next Tray
                  </button>

                  <div style={{ display: "flex", gap: 14 }}>
                    <button
                      onClick={handleConfirmPick}
                      disabled={confirmDisabled}
                      title={!canCall && order.status !== "Completed" ? "No location values for this item — call disabled" : undefined}
                      style={{
                        flex: 1, fontSize: 15, fontWeight: 600,
                        border: "none", borderRadius: 8, padding: "11px 0", cursor: confirmDisabled ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "background .15s",
                        background: confirmDisabled ? "#d1d5db" : "#1e8449",
                        color: confirmDisabled ? "#9ca3af" : "#fff",
                      }}
                      onMouseEnter={(e) => { if (!confirmDisabled) e.currentTarget.style.background = "#196e3c"; }}
                      onMouseLeave={(e) => { if (!confirmDisabled) e.currentTarget.style.background = "#1e8449"; }}
                    >
                      <Check size={18} strokeWidth={3} />
                      {calling ? "Calling…" : order.status === "Completed" ? "Completed" : "Confirm Pick"}
                    </button>
                    <button style={{
                      width: 140, background: "#fff", color: "#1f2937", fontSize: 15, fontWeight: 600,
                      border: "1px solid #d0d4da", borderRadius: 8, padding: "11px 0", cursor: "pointer",
                    }}>
                      Find
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </DashboardShell>
  );
}
