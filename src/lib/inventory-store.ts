import { useSyncExternalStore } from "react";

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
