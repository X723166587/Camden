"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, MENU, MODIFIERS, type MenuItem } from "../../lib/menu";
import type { CartItem } from "../../lib/orders";

type CartLine = CartItem & { key: string };

function money(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export default function PosApp() {
  const [category, setCategory] = useState("Popular");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [tableNumber, setTableNumber] = useState("12");
  const [guests, setGuests] = useState(4);
  const [orderNote, setOrderNote] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const visible = useMemo(() => MENU.filter((item) => {
    const categoryMatch = category === "Popular" ? item.popular : item.category === category;
    const query = search.trim().toLowerCase();
    return categoryMatch && (!query || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query));
  }), [category, search]);
  const subtotal = cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const editing = cart.find((item) => item.key === editingKey);

  function addItem(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((line) => line.menuId === item.id && !line.notes);
      if (existing) return current.map((line) => line.key === existing.key ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { key: crypto.randomUUID(), menuId: item.id, name: item.name, quantity: 1, priceCents: Math.round(item.price * 100), course: item.course, station: item.station, notes: "" }];
    });
  }

  function changeQty(key: string, amount: number) {
    setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  }

  function openNotes(item: CartLine) { setEditingKey(item.key); setCustomNote(item.notes); }
  function toggleModifier(modifier: string) {
    const parts = customNote.split(", ").filter(Boolean);
    setCustomNote(parts.includes(modifier) ? parts.filter((part) => part !== modifier).join(", ") : [...parts, modifier].join(", "));
  }
  function saveNotes() {
    setCart((current) => current.map((item) => item.key === editingKey ? { ...item, notes: customNote.trim() } : item));
    setEditingKey(null);
  }

  async function sendOrder() {
    if (!cart.length || !tableNumber.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tableNumber, guests, note: orderNote, items: cart.map(({ key: _key, ...item }) => item) }) });
      if (!response.ok) throw new Error((await response.json()).error ?? "Order failed");
      setCart([]); setOrderNote(""); setToast(`Table ${tableNumber} sent to kitchen`);
      window.setTimeout(() => setToast(""), 3200);
    } catch (error) { setToast(error instanceof Error ? error.message : "Unable to send order"); }
    finally { setBusy(false); }
  }

  return (
    <main className="pos-app">
      <header className="app-header">
        <div className="brand-lockup"><span className="brand-mark">C</span><div><b>Club Restaurant</b><small>Service console</small></div></div>
        <nav className="mode-switch" aria-label="System views">
          <a className="selected" href="/">Order</a><a href="/control">Expedite</a><a href="/kitchen/entrance">Kitchen screens</a>
        </nav>
        <div className="service-status"><i /> Dinner · Live</div>
      </header>

      <div className="pos-layout">
        <section className="catalog">
          <div className="catalog-head">
            <div><p className="kicker">NEW ORDER</p><h1>Table-side ordering</h1><p>Tap a dish to add it to the order.</p></div>
            <label className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the menu" aria-label="Search the menu" /></label>
          </div>
          <div className="category-scroller" aria-label="Menu categories">
            {CATEGORIES.map((name) => <button key={name} className={category === name ? "active" : ""} onClick={() => setCategory(name)}>{name}</button>)}
          </div>
          <div className="catalog-label"><div><span>{category}</span><small>{visible.length} dishes</small></div><em>Prices include GST</em></div>
          {visible.length ? <div className="menu-grid">
            {visible.map((item, index) => <button className="menu-card" key={item.id} onClick={() => addItem(item)}>
              <div className={`food-swatch swatch-${index % 6}`}><span>{item.course === "entree" ? "ENTRÉE" : item.course.toUpperCase()}</span><i>{item.category.slice(0, 2).toUpperCase()}</i><b>＋</b></div>
              <div className="menu-card-copy"><h3>{item.name}</h3><p>{item.description || `${item.category} · Club menu`}</p><div><strong>${item.price.toFixed(2)}</strong>{item.popular && <span>Popular</span>}</div></div>
            </button>)}
          </div> : <div className="empty-menu"><b>No dishes found</b><span>Try another category or search.</span></div>}
        </section>

        <aside className="cart-panel">
          <div className="cart-head"><div><p className="kicker">CURRENT ORDER</p><h2>Table <input value={tableNumber} onChange={(event) => setTableNumber(event.target.value.replace(/[^a-zA-Z0-9-]/g, ""))} aria-label="Table number" /></h2></div><span className="order-state">Draft</span></div>
          <div className="guest-controls"><span>Guests</span><div><button onClick={() => setGuests(Math.max(1, guests - 1))}>−</button><b>{guests}</b><button onClick={() => setGuests(guests + 1)}>＋</button></div><em>Dine in</em></div>
          <div className="cart-items">
            {!cart.length && <div className="empty-cart"><span>✦</span><b>Your order is empty</b><p>Choose dishes from the menu to begin.</p></div>}
            {cart.map((item) => <article className="cart-line" key={item.key}>
              <div className="qty-control"><button onClick={() => changeQty(item.key, -1)}>−</button><b>{item.quantity}</b><button onClick={() => changeQty(item.key, 1)}>＋</button></div>
              <button className="line-copy" onClick={() => openNotes(item)}><strong>{item.name}</strong><small className={item.notes ? "has-note" : ""}>{item.notes || "＋ Add special request"}</small></button>
              <span>{money(item.priceCents * item.quantity)}</span>
            </article>)}
          </div>
          <label className="order-note"><span>Order note</span><textarea value={orderNote} onChange={(event) => setOrderNote(event.target.value)} placeholder="Birthday, allergy, service request…" rows={2} /></label>
          <div className="course-flow"><i className={cart.some((item) => item.course === "entree") ? "on" : ""} /><span>Entrée</span><b>→</b><i className={cart.some((item) => item.course === "main") ? "on" : ""} /><span>Main</span><b>→</b><i className={cart.some((item) => item.course === "dessert") ? "on" : ""} /><span>Dessert</span></div>
          <div className="cart-total"><span>Subtotal <small>GST included</small></span><strong>{money(subtotal)}</strong></div>
          <button className="primary-action" disabled={!cart.length || busy} onClick={sendOrder}><span>{busy ? "Sending…" : "Send to kitchen"}</span><b>{money(subtotal)}　→</b></button>
          <p className="send-hint"><i /> Entrées fire now. Later courses are held.</p>
        </aside>
      </div>

      {editing && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditingKey(null)}>
        <section className="modifier-modal" role="dialog" aria-modal="true" aria-label={`Special request for ${editing.name}`}>
          <button className="modal-close" onClick={() => setEditingKey(null)}>×</button><p className="kicker">SPECIAL REQUEST</p><h2>{editing.name}</h2><p>Select common requests or type a kitchen note.</p>
          <div className="modifier-chips">{MODIFIERS.map((modifier) => <button key={modifier} className={customNote.split(", ").includes(modifier) ? "active" : ""} onClick={() => toggleModifier(modifier)}>{modifier}</button>)}</div>
          <label><span>Kitchen note</span><textarea autoFocus rows={3} value={customNote} onChange={(event) => setCustomNote(event.target.value)} placeholder="e.g. severe shellfish allergy" /></label>
          <button className="save-note" onClick={saveNotes}>Save request</button>
        </section>
      </div>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
