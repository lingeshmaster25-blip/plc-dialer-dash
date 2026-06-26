import { useSyncExternalStore } from "react";

export type Priority = "High" | "Medium" | "Low";
export type Status = "Queued" | "Released" | "Picking" | "Completed";
export type OrderItem = {
  sku: string;
  item: string;
  bin: string;
  qty: number;
  picked?: boolean;
};
export type Order = {
  id: string;
  emp: string;
  priority: Priority;
  status: Status;
  items: OrderItem[];
  createdAt: number;
};

// ── singleton state ──────────────────────────────────────────────────────────
let orders: Order[] = [];
let orderSeq = 534;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// ── reads ────────────────────────────────────────────────────────────────────
export function getOrders() { return orders; }

export function getPickingOrder(): Order | undefined {
  return (
    orders.find((o) => o.status === "Picking") ??
    orders.find((o) => o.status === "Released") ??
    orders.find((o) => o.status === "Queued")
  );
}

// ── mutations ────────────────────────────────────────────────────────────────

/** Create a new order from the Order Picking form. Returns the new order id. */
export function addOrder(
  emp: string,
  priority: Priority,
  items: Omit<OrderItem, "picked">[],
): string {
  const id = `#${orderSeq}`;
  orderSeq += 2;
  orders = [
    { id, emp, priority, status: "Queued", items: items.map((it) => ({ ...it, picked: false })), createdAt: Date.now() },
    ...orders,
  ];
  emit();
  return id;
}

/** Move a Queued order to Released so it appears as active in Picklist. */
export function releaseToPicklist(id: string) {
  orders = orders.map((o) =>
    o.id === id && (o.status === "Queued") ? { ...o, status: "Released" as Status } : o,
  );
  emit();
}

/** Mark a single item as picked (or un-picked). */
export function toggleItemPicked(orderId: string, itemIndex: number) {
  orders = orders.map((o) => {
    if (o.id !== orderId) return o;
    const items = o.items.map((it, i) =>
      i === itemIndex ? { ...it, picked: !it.picked } : it,
    );
    // Auto-advance status once any picking starts
    const anyPicked = items.some((it) => it.picked);
    const status: Status = anyPicked && o.status === "Released" ? "Picking" : o.status;
    return { ...o, items, status };
  });
  emit();
}

/** Confirm all items in the active order as picked → Completed. */
export function confirmPick(orderId: string): boolean {
  let completed = false;
  orders = orders.map((o) => {
    if (o.id !== orderId) return o;
    completed = true;
    return { ...o, status: "Completed" as Status, items: o.items.map((it) => ({ ...it, picked: true })) };
  });
  emit();
  return completed;
}

// ── hook ─────────────────────────────────────────────────────────────────────
export function useOrders() {
  return useSyncExternalStore(subscribe, getOrders, getOrders);
}

// ── next order id preview (for UI display before creation) ───────────────────
export function peekNextOrderId() { return `#${orderSeq}`; }
