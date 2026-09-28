import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  tableNumber: text("table_number").notNull(),
  guests: integer("guests").notNull().default(1),
  status: text("status", { enum: ["open", "complete"] }).notNull().default("open"),
  currentCourse: text("current_course", { enum: ["entree", "main", "dessert", "complete"] }).notNull().default("entree"),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("idx_orders_status_created").on(table.status, table.createdAt)]);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuId: text("menu_id").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  priceCents: integer("price_cents").notNull(),
  course: text("course", { enum: ["entree", "main", "dessert"] }).notNull(),
  station: text("station", { enum: ["entrance", "mains", "dessert"] }).notNull(),
  notes: text("notes").notNull().default(""),
  status: text("status", { enum: ["held", "queued", "cooking", "ready", "served"] }).notNull().default("held"),
}, (table) => [
  index("idx_order_items_order").on(table.orderId),
  index("idx_order_items_station_status").on(table.station, table.status),
]);
