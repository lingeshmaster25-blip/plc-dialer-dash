import { getRecords, usePutawayRecords } from "./inventory-store";
import { ORDERS, getPickingOrder } from "./orders-store";

export type Activity = { time: string; action: string; detail: string };

// Recent activity feed (would stream from the PLC/event log in production).
export const RECENT_ACTIVITY: Activity[] = [
  { time: "10:24 AM", action: "Order #424 Picked", detail: "Tray T12 Bin B5" },
  { time: "10:18 AM", action: "Tray 14 Returned", detail: "By Operator John" },
  { time: "10:07 AM", action: "Calibration Finished", detail: "All Systems Normal" },
  { time: "09:45 AM", action: "Order #422 Picked", detail: "Tray T07 Bin B7" },
  { time: "09:37 AM", action: "Order #420 Picked", detail: "Tray T08 Bin B3" },
  { time: "09:32 AM", action: "Tray 10 Picked", detail: "By Operator Bob" },
];

// Warehouse capacity — system configuration (PLC / setup), not live demo data.
export const CAPACITY = { totalTrays: 17, totalBins: 36 };

// Uptime: a realistic running clock that ticks up from app start.
const BOOT = Date.now();
const BASE_UPTIME_MS = (10 * 60 + 25) * 60 * 1000; // start at 10h 25m

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
  const activeOrder = picking ? picking.id : getPickingOrder().id;

  return {
    uptime: fmtUptime(BASE_UPTIME_MS + (Date.now() - BOOT)),
    orders, activeOrder, queue,
    totalTrays, available, totalBins, skus, availablePct,
  };
}
