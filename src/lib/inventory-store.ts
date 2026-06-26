import { useMemo, useSyncExternalStore } from "react";

export type PutawayRecord = {
  sku: string;
  description: string;
  qty: number;
  storingType: "Tray" | "Bin";
  partition: "Single" | "Multi";
  binId: string;
  trayId: string;
  bins: string[];
  ts: number;
};

export type Availability = { bin: string; tray: string; available: number; description: string };

const KEY = "trilo.putaway.records.v2";

// No demo data — inventory is populated only by real putaways.
const SEED: PutawayRecord[] = [];

function load(): PutawayRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PutawayRecord[];
  } catch { /* localStorage unavailable */ }
  return [...SEED];
}

let records: PutawayRecord[] = load();
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(records)); } catch { /* ignore */ }
}
function emit() { listeners.forEach((l) => l()); }

/** Record a completed putaway. Called from the Putaway page on KEEP. */
export function addPutaway(rec: Omit<PutawayRecord, "ts">) {
  records = [{ ...rec, ts: Date.now() }, ...records];
  persist();
  emit();
}

export function getRecords() { return records; }

/**
 * Maximum total units a single bin is allowed to hold.
 * System configuration — adjust to match the real rack/bin spec.
 */
export const BIN_CAPACITY = 100;

/** Total units currently stored in a given bin (matched case-insensitively). */
export function getBinUsage(binId: string): number {
  const key = binId.trim().toUpperCase();
  if (!key) return 0;
  return records
    .filter((r) => r.binId.trim().toUpperCase() === key)
    .reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
}

/**
 * Decrement stock for a SKU by `qty` when an order is picked.
 * Works by reducing qty on the most-recent matching record(s) in order,
 * removing a record entirely when its qty hits zero.
 */
export function decrementSku(sku: string, qty: number) {
  const key = sku.trim().toUpperCase();
  let remaining = qty;
  const next: PutawayRecord[] = [];
  for (const r of records) {
    if (remaining <= 0 || r.sku.trim().toUpperCase() !== key) {
      next.push(r);
      continue;
    }
    const take = Math.min(r.qty, remaining);
    remaining -= take;
    const newQty = r.qty - take;
    if (newQty > 0) next.push({ ...r, qty: newQty });
    // qty === 0 → drop the record (bin freed)
  }
  records = next;
  persist();
  emit();
}

/** Aggregate availability for a SKU from all putaway records. */
export function lookupBySku(sku: string): Availability | null {
  const key = sku.trim().toUpperCase();
  if (!key) return null;
  const matches = records.filter((r) => r.sku.trim().toUpperCase() === key);
  if (matches.length === 0) return null;
  const latest = matches[0]; // newest first
  const available = matches.reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
  return { bin: latest.binId, tray: latest.trayId, available, description: latest.description };
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Subscribe a component to inventory changes. */
export function usePutawayRecords() {
  return useSyncExternalStore(subscribe, getRecords, getRecords);
}

/** SKU total units below this surface as low-stock notifications. */
export const LOW_STOCK_THRESHOLD = 10;

export type LowStockItem = { sku: string; description: string; qty: number };

/** Reactive list of SKUs whose total on-hand quantity is low (0 < qty < threshold). */
export function useLowStock(): LowStockItem[] {
  const recs = usePutawayRecords();
  return useMemo(() => {
    const map = new Map<string, LowStockItem>();
    for (const r of recs) {
      const key = r.sku.trim().toUpperCase();
      if (!key) continue;
      const cur = map.get(key) ?? { sku: key, description: r.description, qty: 0 };
      cur.qty += Number(r.qty) || 0;
      if (!cur.description && r.description) cur.description = r.description;
      map.set(key, cur);
    }
    return [...map.values()].filter((i) => i.qty > 0 && i.qty < LOW_STOCK_THRESHOLD);
  }, [recs]);
}
