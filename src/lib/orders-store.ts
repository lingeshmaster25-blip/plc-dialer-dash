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

// Items for order #532 — also drives the Picklist screen.
const ORDER_532: OrderItem[] = [
  { sku: "SKU-007", item: "Automotive Part", bin: "B02", qty: 24 },
  { sku: "SKU-053", item: "Screws", bin: "B03", qty: 10 },
  { sku: "SKU-074", item: "Nails", bin: "B06", qty: 32 },
  { sku: "SKU-032", item: "Washers", bin: "B08", qty: 34 },
];

export const ORDERS: Order[] = [
  { id: "#534", emp: "Deepak", priority: "High", status: "Picking", items: ORDER_532 },
  { id: "#532", emp: "Mohan", priority: "High", status: "Queued", items: ORDER_532 },
  { id: "#530", emp: "Guru", priority: "Medium", status: "Queued", items: [{ sku: "SKU-012", item: "Bolts", bin: "B01", qty: 50 }, { sku: "SKU-031", item: "Washers", bin: "B04", qty: 120 }] },
  { id: "#528", emp: "Deepak", priority: "Medium", status: "Completed", items: [{ sku: "SKU-101", item: "Brake Pads", bin: "B05", qty: 8 }] },
  { id: "#526", emp: "Mohan", priority: "Low", status: "Queued", items: [{ sku: "SKU-204", item: "Filters", bin: "B07", qty: 16 }] },
  { id: "#524", emp: "Guru", priority: "Low", status: "Completed", items: [{ sku: "SKU-077", item: "Gaskets", bin: "B09", qty: 30 }] },
  { id: "#534", emp: "Deepak", priority: "Medium", status: "Picking", items: ORDER_532 },
  { id: "#532", emp: "Mohan", priority: "High", status: "Queued", items: [{ sku: "SKU-019", item: "Bearings", bin: "B02", qty: 12 }] },
  { id: "#530", emp: "Guru", priority: "Medium", status: "Queued", items: [{ sku: "SKU-088", item: "Seals", bin: "B03", qty: 40 }] },
  { id: "#528", emp: "Deepak", priority: "Low", status: "Completed", items: [{ sku: "SKU-101", item: "Brake Pads", bin: "B05", qty: 8 }] },
  { id: "#526", emp: "Mohan", priority: "High", status: "Queued", items: [{ sku: "SKU-204", item: "Filters", bin: "B07", qty: 16 }] },
];

/** The order currently being picked (shown on the Picklist screen). */
export function getPickingOrder(): Order {
  return ORDERS.find((o) => o.id === "#532") ?? ORDERS[0];
}
