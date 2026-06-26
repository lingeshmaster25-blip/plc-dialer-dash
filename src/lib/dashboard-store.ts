import { getRecords, usePutawayRecords } from "./inventory-store";
import { ORDERS, getPickingOrder } from "./orders-store";

export type Activity = { time: string; action: string; detail: string };

// Recent activity feed — populated by real events (picks, returns, calibration…).
export const RECENT_ACTIVITY: Activity[] = [];

// Warehouse capacity — system configuration (PLC / setup), not live demo data.
export const CAPACITY = { totalTrays: 17, totalBins: 36 };

// Uptime: a realistic running clock that ticks up from app start.
const BOOT = Date.now();
const BASE_UPTIME_MS = 0; // count up from app start

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
  usePutawayRecords(); // re-render when inventory changes
  const records = getRecords();

  // Inventory-derived
  const skus = new Set(records.map((r) => r.sku.trim().toUpperCase()).filter(Boolean)).size;
  const occupiedBins = new Set(records.map((r) => r.binId.trim().toUpperCase()).filter(Boolean)).size;
  const totalBins = CAPACITY.totalBins;
  const totalTrays = CAPACITY.totalTrays;
  const available = Math.max(0, totalBins - occupiedBins);
  const availablePct = totalBins > 0 ? Math.round((available / totalBins) * 1000) / 10 : 0;

  // Orders-derived
  const orders = ORDERS.length;
  const queue = ORDERS.filter((o) => o.status === "Queued").length;
  const picking = ORDERS.find((o) => o.status === "Picking");
  const activeOrder = picking?.id ?? getPickingOrder()?.id ?? "—";

  return {
    uptime: fmtUptime(BASE_UPTIME_MS + (Date.now() - BOOT)),
    orders, activeOrder, queue,
    totalTrays, available, totalBins, skus, availablePct,
  };
}
