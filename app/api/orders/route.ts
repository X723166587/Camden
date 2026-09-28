import { env } from "cloudflare:workers";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { orderItems, orders } from "../../../db/schema";
import type { CartItem, ItemStatus, OrderRecord } from "../../../lib/orders";
import type { Course } from "../../../lib/menu";

async function ensureSchema() {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY NOT NULL,
      table_number TEXT NOT NULL,
      guests INTEGER DEFAULT 1 NOT NULL,
      status TEXT DEFAULT 'open' NOT NULL,
      current_course TEXT DEFAULT 'entree' NOT NULL,
      note TEXT DEFAULT '' NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY NOT NULL,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      course TEXT NOT NULL,
      station TEXT NOT NULL,
      notes TEXT DEFAULT '' NOT NULL,
      status TEXT DEFAULT 'held' NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_station_status ON order_items(station, status)"),
    env.DB.prepare("PRAGMA optimize"),
  ]);
}

async function listOrders(): Promise<OrderRecord[]> {
  const db = getDb();
  const rows = await db.select().from(orders).where(ne(orders.status, "complete")).orderBy(desc(orders.createdAt));
  if (!rows.length) return [];
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((row) => row.id)));
  return rows.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) }));
}

async function fireCourse(orderId: string, course: Course) {
  const db = getDb();
  const now = Date.now();
  await db.update(orderItems).set({ status: "queued" }).where(and(eq(orderItems.orderId, orderId), eq(orderItems.course, course), eq(orderItems.status, "held")));
  await db.update(orders).set({ currentCourse: course, updatedAt: now }).where(eq(orders.id, orderId));
}

async function autoAdvance(orderId: string, completedCourse: Course) {
  const db = getDb();
  const courseItems = await db.select().from(orderItems).where(and(eq(orderItems.orderId, orderId), eq(orderItems.course, completedCourse)));
  if (!courseItems.length || !courseItems.every((item) => item.status === "ready" || item.status === "served")) return;
  if (completedCourse === "entree") await fireCourse(orderId, "main");
  if (completedCourse === "main") await fireCourse(orderId, "dessert");
}

export async function GET() {
  try {
    await ensureSchema();
    return Response.json({ orders: await listOrders() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const payload = await request.json() as { tableNumber?: string; guests?: number; note?: string; items?: CartItem[]; demo?: boolean };
    const demoItems: CartItem[] = [
      { menuId: "entree-mixed-entree", name: "Mixed Entree", quantity: 1, priceCents: 1200, course: "entree", station: "entrance", notes: "1 × steamed, nut allergy" },
      { menuId: "chefs-suggestions-lemon-chicken-fillet", name: "Lemon Chicken Fillet", quantity: 1, priceCents: 2200, course: "main", station: "mains", notes: "Sauce on side" },
      { menuId: "rice-large-fried-rice", name: "Large Fried Rice", quantity: 1, priceCents: 1300, course: "main", station: "mains", notes: "No onion" },
      { menuId: "dessert-banana-fritter", name: "Banana Fritter", quantity: 2, priceCents: 900, course: "dessert", station: "dessert", notes: "" },
    ];
    const items = payload.demo ? demoItems : payload.items ?? [];
    if (!items.length) return Response.json({ error: "At least one item is required" }, { status: 400 });
    const tableNumber = (payload.demo ? "18" : payload.tableNumber)?.trim();
    if (!tableNumber) return Response.json({ error: "Table number is required" }, { status: 400 });

    const db = getDb();
    const id = crypto.randomUUID();
    const now = Date.now();
    const hasEntree = items.some((item) => item.course === "entree");
    const firstCourse: Course = hasEntree ? "entree" : items.some((item) => item.course === "main") ? "main" : "dessert";
    await db.batch([
      db.insert(orders).values({ id, tableNumber, guests: payload.demo ? 4 : Math.max(1, payload.guests ?? 1), note: payload.demo ? "Birthday table · serve dishes to share" : payload.note?.trim() ?? "", currentCourse: firstCourse, createdAt: now, updatedAt: now }),
      db.insert(orderItems).values(items.map((item) => ({
        id: crypto.randomUUID(), orderId: id, menuId: item.menuId, name: item.name, quantity: item.quantity,
        priceCents: item.priceCents, course: item.course, station: item.station, notes: item.notes,
        status: item.course === firstCourse ? "queued" as const : "held" as const,
      }))),
    ]);
    return Response.json({ orderId: id, orders: await listOrders() }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create order" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureSchema();
    const payload = await request.json() as {
      action?: "itemStatus" | "fireCourse" | "complete";
      orderId?: string;
      itemId?: string;
      status?: ItemStatus;
      course?: Course;
    };
    if (!payload.orderId || !payload.action) return Response.json({ error: "Missing action or order" }, { status: 400 });
    const db = getDb();
    if (payload.action === "itemStatus" && payload.itemId && payload.status) {
      const [item] = await db.select().from(orderItems).where(eq(orderItems.id, payload.itemId)).limit(1);
      if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      await db.update(orderItems).set({ status: payload.status }).where(eq(orderItems.id, payload.itemId));
      await db.update(orders).set({ updatedAt: Date.now() }).where(eq(orders.id, payload.orderId));
      if (payload.status === "ready") await autoAdvance(payload.orderId, item.course);
    }
    if (payload.action === "fireCourse" && payload.course) await fireCourse(payload.orderId, payload.course);
    if (payload.action === "complete") {
      await db.update(orderItems).set({ status: "served" }).where(eq(orderItems.orderId, payload.orderId));
      await db.update(orders).set({ status: "complete", currentCourse: "complete", updatedAt: Date.now() }).where(eq(orders.id, payload.orderId));
    }
    return Response.json({ orders: await listOrders() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update order" }, { status: 500 });
  }
}
