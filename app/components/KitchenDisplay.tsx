"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Station } from "../../lib/menu";
import type { ItemStatus, OrderRecord } from "../../lib/orders";

const STATIONS: { id: Station; label: string; number: string }[] = [
  { id: "entrance", label: "Entrée", number: "01" }, { id: "mains", label: "Mains", number: "02" }, { id: "dessert", label: "Dessert", number: "03" },
];
const NEXT_STATUS: Record<ItemStatus, ItemStatus> = { held: "queued", queued: "cooking", cooking: "ready", ready: "served", served: "served" };

function elapsed(createdAt: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - createdAt) / 60000));
  return `${minutes}:${String(Math.floor(((now - createdAt) % 60000) / 1000)).padStart(2, "0")}`;
}

export default function KitchenDisplay({ station }: { station: Station }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) throw new Error("Kitchen connection unavailable");
      setOrders((await response.json()).orders); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Kitchen connection unavailable"); }
  }, []);

  useEffect(() => { loadOrders(); const poll = window.setInterval(loadOrders, 2500); const clock = window.setInterval(() => setNow(Date.now()), 1000); return () => { clearInterval(poll); clearInterval(clock); }; }, [loadOrders]);

  const visibleOrders = useMemo(() => orders.map((order) => ({ ...order, items: order.items.filter((item) => item.station === station && item.status !== "held" && item.status !== "served") })).filter((order) => order.items.length), [orders, station]);
  const queued = visibleOrders.reduce((sum, order) => sum + order.items.filter((item) => item.status === "queued").length, 0);
  const cooking = visibleOrders.reduce((sum, order) => sum + order.items.filter((item) => item.status === "cooking").length, 0);
  const ready = visibleOrders.reduce((sum, order) => sum + order.items.filter((item) => item.status === "ready").length, 0);

  async function advanceItem(orderId: string, itemId: string, status: ItemStatus) {
    setBusyId(itemId);
    try {
      const response = await fetch("/api/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "itemStatus", orderId, itemId, status: NEXT_STATUS[status] }) });
      if (!response.ok) throw new Error("Could not update ticket");
      setOrders((await response.json()).orders); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update ticket"); }
    finally { setBusyId(""); }
  }

  async function addDemo() {
    setBusyId("demo");
    try { await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ demo: true }) }); await loadOrders(); }
    finally { setBusyId(""); }
  }

  const current = STATIONS.find((item) => item.id === station)!;
  return <main className="kds-app">
    <header className="kds-header">
      <div className="kds-brand"><span className="brand-mark">C</span><div><b>CLUB KITCHEN</b><small>Kitchen display system</small></div></div>
      <nav className="kds-stations">{STATIONS.map((item) => <a key={item.id} href={`/kitchen/${item.id}`} className={item.id === station ? "active" : ""}><span>{item.number}</span>{item.label}</a>)}</nav>
      <a className="exit-kds" href="/">← Order screen</a>
      <div className="kds-clock">{new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now)}<small>{new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short" }).format(now)}</small></div>
    </header>

    <section className="kds-toolbar">
      <div><p className="kicker">STATION {current.number}</p><h1>{current.label} pass</h1></div>
      <div className="ticket-stats"><span><i className="queued" />{queued} new</span><span><i className="cooking" />{cooking} cooking</span><span><i className="ready" />{ready} ready</span></div>
      <button onClick={loadOrders}>↻ Refresh</button>
    </section>

    {error && <div className="kds-error">⚠ {error} <button onClick={loadOrders}>Retry</button></div>}
    <section className="ticket-grid">
      {visibleOrders.map((order, orderIndex) => {
        const age = Math.floor((now - order.createdAt) / 60000);
        return <article className={`ticket ${age >= 15 ? "urgent" : age >= 8 ? "watch" : ""}`} key={order.id}>
          <header><div><span>TABLE</span><b>{order.tableNumber}</b></div><em>{order.guests} guests</em><time>{elapsed(order.createdAt, now)}</time></header>
          {order.note && <div className="ticket-note"><b>ORDER NOTE</b>{order.note}</div>}
          <div className="ticket-lines">{order.items.map((item) => <button disabled={busyId === item.id} onClick={() => advanceItem(order.id, item.id, item.status)} className={`ticket-line ${item.status}`} key={item.id}>
            <strong><span>{item.quantity}</span>{item.name}</strong>
            {item.notes && <small>⚑ {item.notes}</small>}
            <em>{item.status === "queued" ? "START" : item.status === "cooking" ? "MARK READY" : "COLLECTED"}　→</em>
          </button>)}</div>
          <footer><span>#{String(visibleOrders.length - orderIndex).padStart(3, "0")}</span><b>{station === "entrance" ? "Ready all → fires mains" : station === "mains" ? "Ready all → offers dessert" : "Tap ready item when collected"}</b></footer>
        </article>;
      })}
      {!visibleOrders.length && !error && <div className="kds-empty"><span>✓</span><h2>All clear at {current.label.toLowerCase()}</h2><p>New tickets appear here automatically.</p><button disabled={busyId === "demo"} onClick={addDemo}>{busyId === "demo" ? "Loading…" : "Load a demo order"}</button></div>}
    </section>
    <footer className="kds-legend"><span><i className="queued" />Tap once to start</span><span><i className="cooking" />Tap again when ready</span><span><i className="ready" />Tap when collected</span><b>Live sync · {orders.length} open tables</b></footer>
  </main>;
}
