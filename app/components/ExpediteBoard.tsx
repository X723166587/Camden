"use client";

import { useCallback, useEffect, useState } from "react";
import type { Course } from "../../lib/menu";
import type { OrderRecord } from "../../lib/orders";

function minutesSince(time: number) { return Math.max(0, Math.floor((Date.now() - time) / 60000)); }

export default function ExpediteBoard() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => { try { const response = await fetch("/api/orders", { cache: "no-store" }); if (!response.ok) throw new Error("Unable to connect to kitchen"); setOrders((await response.json()).orders); setError(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to connect to kitchen"); } }, []);
  useEffect(() => { load(); const poll = window.setInterval(load, 2500); return () => clearInterval(poll); }, [load]);

  async function action(orderId: string, type: "fireCourse" | "complete", course?: Course) {
    setBusy(`${orderId}-${type}-${course ?? ""}`);
    try { const response = await fetch("/api/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: type, orderId, course }) }); if (!response.ok) throw new Error("Update failed"); setOrders((await response.json()).orders); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Update failed"); }
    finally { setBusy(""); }
  }

  async function addDemo() { setBusy("demo"); try { await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ demo: true }) }); await load(); } finally { setBusy(""); } }

  return <main className="expo-app">
    <header className="app-header">
      <div className="brand-lockup"><span className="brand-mark">C</span><div><b>Club Restaurant</b><small>Service console</small></div></div>
      <nav className="mode-switch" aria-label="System views"><a href="/">Order</a><a className="selected" href="/control">Expedite</a><a href="/kitchen/entrance">Kitchen screens</a></nav>
      <div className="service-status"><i /> Dinner · Live</div>
    </header>
    <section className="expo-heading"><div><p className="kicker">SERVICE CONTROL</p><h1>Course flow</h1><p>Track every table and release the next course when guests are ready.</p></div><div className="expo-summary"><span><b>{orders.length}</b> open tables</span><span><b>{orders.reduce((sum, order) => sum + order.items.filter((item) => item.status === "ready").length, 0)}</b> ready dishes</span></div></section>
    {error && <div className="expo-error">{error}<button onClick={load}>Retry</button></div>}
    <section className="expo-grid">
      {orders.map((order) => {
        const total = order.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
        return <article className="expo-card" key={order.id}>
          <header><div><span>TABLE</span><b>{order.tableNumber}</b></div><em>{order.guests} guests</em><time>{minutesSince(order.createdAt)} min</time></header>
          <div className="course-timeline">
            {(["entree", "main", "dessert"] as Course[]).map((course, index) => {
              const items = order.items.filter((item) => item.course === course);
              const done = items.length > 0 && items.every((item) => item.status === "ready" || item.status === "served");
              const active = items.some((item) => item.status === "queued" || item.status === "cooking" || item.status === "ready");
              const held = items.some((item) => item.status === "held");
              return <div className={`course-step ${done ? "done" : active ? "active" : held ? "held" : "empty"}`} key={course}><i>{done ? "✓" : index + 1}</i><span>{course === "entree" ? "Entrée" : course[0].toUpperCase() + course.slice(1)}<small>{!items.length ? "No items" : done ? "Ready" : held ? "On hold" : `${items.filter((item) => item.status === "ready").length}/${items.length} ready`}</small></span></div>;
            })}
          </div>
          {order.note && <p className="expo-note"><b>⚑ Note</b>{order.note}</p>}
          <div className="expo-items">{order.items.map((item) => <div key={item.id}><span>{item.quantity} × {item.name}{item.notes && <small>{item.notes}</small>}</span><em className={item.status}>{item.status}</em></div>)}</div>
          <footer><span><small>Order total</small>${(total / 100).toFixed(2)}</span><div>
            <button className="soft" disabled={!order.items.some((item) => item.course === "main" && item.status === "held") || !!busy} onClick={() => action(order.id, "fireCourse", "main")}>Fire mains</button>
            <button className="soft dessert" disabled={!order.items.some((item) => item.course === "dessert" && item.status === "held") || !!busy} onClick={() => action(order.id, "fireCourse", "dessert")}>Guest wants dessert</button>
            <button className="finish" disabled={!!busy} onClick={() => action(order.id, "complete")}>Close table</button>
          </div></footer>
        </article>;
      })}
      {!orders.length && !error && <div className="expo-empty"><span>✦</span><h2>No open tables</h2><p>Orders sent from the iPad will appear here.</p><div><a href="/">Create an order</a><button disabled={busy === "demo"} onClick={addDemo}>Load demo order</button></div></div>}
    </section>
  </main>;
}
