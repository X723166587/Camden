import type { Course, Station } from "./menu";

export type ItemStatus = "held" | "queued" | "cooking" | "ready" | "served";

export type OrderItemRecord = {
  id: string;
  orderId: string;
  menuId: string;
  name: string;
  quantity: number;
  priceCents: number;
  course: Course;
  station: Station;
  notes: string;
  status: ItemStatus;
};

export type OrderRecord = {
  id: string;
  tableNumber: string;
  guests: number;
  status: "open" | "complete";
  currentCourse: Course | "complete";
  note: string;
  createdAt: number;
  updatedAt: number;
  items: OrderItemRecord[];
};

export type CartItem = {
  menuId: string;
  name: string;
  quantity: number;
  priceCents: number;
  course: Course;
  station: Station;
  notes: string;
};
