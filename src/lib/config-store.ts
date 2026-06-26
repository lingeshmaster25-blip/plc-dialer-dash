import { useSyncExternalStore } from "react";

export type AppConfig = {
  binCapacity: number;       // max units per bin
  totalBins: number;         // physical bin count
  totalTrays: number;        // physical tray count
  lowStockThreshold: number; // SKU total below this → low-stock notification
  staleOrderMins: number;    // Queued longer than this (minutes) → troubleshoot alert
};

export const DEFAULT_CONFIG: AppConfig = {
  binCapacity: 100,
  totalBins: 36,
  totalTrays: 17,
  lowStockThreshold: 10,
  staleOrderMins: 2,
};

const KEY = "trilo.config.v1";

function load(): AppConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<AppConfig>) };
  } catch { /* localStorage unavailable */ }
  return { ...DEFAULT_CONFIG };
}

let config: AppConfig = load();
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(config)); } catch { /* ignore */ }
}
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Non-reactive snapshot (for event handlers / non-component code). */
export function getConfig(): AppConfig { return config; }

/** Update one or more config values and persist. */
export function setConfig(patch: Partial<AppConfig>) {
  config = { ...config, ...patch };
  persist();
  emit();
}

/** Restore all values to their defaults. */
export function resetConfig() {
  config = { ...DEFAULT_CONFIG };
  persist();
  emit();
}

/** Reactive config — components re-render when any value changes. */
export function useConfig(): AppConfig {
  return useSyncExternalStore(subscribe, getConfig, getConfig);
}
