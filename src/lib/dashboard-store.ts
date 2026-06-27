import { useSyncExternalStore } from "react";
import { getRecords, usePutawayRecords } from "./inventory-store";
import { getOrders, useOrders, getPickingOrder } from "./orders-store";
import { useConfig } from "./config-store";

export type Activity = { time: string; action: string; detail: string };

// ── Recent activity feed ─────────────────────────────────────────────────────
const ACTIVITY_KEY = "trilo.activity.v1";

function loadActivity(): Activity[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) return JSON.parse(raw) as Activity[];
  } catch { /* ignore */ }
  return [];
}

function persistActivity(feed: Activity[]) {
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(feed)); } catch { /* ignore */ }
}

let RECENT_ACTIVITY: Activity[] = loadActivity();
const activityListeners = new Set<() => void>();

function emitActivity() { activityListeners.forEach((l) => l()); }

export function pushActivity(action: string, detail: string) {
  const now = new Date();
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  RECENT_ACTIVITY = [{ time, action, detail }, ...RECENT_ACTIVITY].slice(0, 20);
  persistActivity(RECENT_ACTIVITY);
  emitActivity();
}

export function getActivity() { return RECENT_ACTIVITY; }

export function useActivity() {
  return useSyncExternalStore(
    (cb) => { activityListeners.add(cb); return () => activityListeners.delete(cb); },
    getActivity,
    getActivity,
  );
}

// ── Uptime ───────────────────────────────────────────────────────────────────
const BOOT = Date.now();

function fmtUptime(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
}

export type DashboardMetrics = {
  uptime: string;
  orders: number;
  activeOrder: string;
  queue: number;
  totalTrays: number;
  available: number;
  totalBins: number;
  skus: number;
  availablePct: number;
};

export function useDashboardMetrics(): DashboardMetrics {
  usePutawayRecords();
  useOrders();
  const records = getRecords();
  const orders = getOrders();

  const skus = new Set(records.map((r) => r.sku.trim().toUpperCase()).filter(Boolean)).size;
  const occupiedBins = new Set(records.map((r) => r.binId.trim().toUpperCase()).filter(Boolean)).size;
  const cfg = useConfig();
  const totalBins = cfg.totalBins;
  const totalTrays = cfg.totalTrays;
  const available = Math.max(0, totalBins - occupiedBins);
  const availablePct = totalBins > 0 ? Math.round((available / totalBins) * 1000) / 10 : 0;

  const activeOrders = orders.filter((o) => o.status !== "Completed");
  const queue = orders.filter((o) => o.status === "Queued" || o.status === "Released").length;
  const picking = getPickingOrder();
  const activeOrder = picking?.id ?? "—";

  return {
    uptime: fmtUptime(Date.now() - BOOT),
    orders: activeOrders.length,
    activeOrder,
    queue,
    totalTrays, available, totalBins, skus, availablePct,
  };
}
