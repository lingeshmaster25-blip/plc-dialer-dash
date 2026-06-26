export type Priority = "High" | "Medium" | "Low";
export type Status = "Picking" | "Queued" | "Completed";
export type OrderItem = { sku: string; item: string; bin: string; qty: number };
export type Order = {
  id: string;
  emp: string;
  priority: Priority;
  status: Status;
  items: OrderItem[];
};

// No demo data — orders are created through the app.
export const ORDERS: Order[] = [];

/** The order currently being picked (shown on the Picklist screen), if any. */
export function getPickingOrder(): Order | undefined {
  return ORDERS.find((o) => o.status === "Picking") ?? ORDERS.find((o) => o.status === "Queued") ?? ORDERS[0];
}
