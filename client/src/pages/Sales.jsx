import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

export default function Sales({ config, storeType, onSold }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setProducts(await api.products());
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (category !== "todos" && p.category !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
    });
  }, [products, query, category]);

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const money = (n) => `${config.currency} ${Number(n).toFixed(2)}`;

  function addToCart(product) {
    setSuccess("");
    setError("");
    setCart((prev) => {
      const exists = prev.find((i) => i.productId === product.id);
      if (exists) {
        if (exists.qty + 1 > product.stock) {
          setError(`Stock insuficiente de ${product.name}`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      if (product.stock < 1) {
        setError(`Sin stock: ${product.name}`);
        return prev;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          stock: product.stock,
          qty: 1,
        },
      ];
    });
  }

  function setQty(productId, qty) {
    const n = Number(qty);
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          if (n > i.stock) {
            setError(`Máximo ${i.stock} de ${i.name}`);
            return { ...i, qty: i.stock };
          }
          return { ...i, qty: n };
        })
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function checkout() {
    if (!cart.length) {
      setError("Agrega productos al carrito");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const sale = await api.createSale({
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
        customerName,
        paymentMethod,
        note,
      });
      setSuccess(`Venta #${sale.number} registrada · Total ${money(sale.total)}`);
      setCart([]);
      setCustomerName("");
      setNote("");
      setPaymentMethod("efectivo");
      await load();
      onSold?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-block">
      <header className="page-head">
        <div>
          <p className="eyebrow">Punto de venta</p>
          <h1>Nueva venta</h1>
          <p className="muted">Selecciona productos y cobra</p>
        </div>
      </header>

      {error && <div className="alert err">{error}</div>}
      {success && <div className="alert ok">{success}</div>}

      <div className="split pos">
        <div className="panel">
          <div className="filters">
            <input
              placeholder="Buscar producto o SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="todos">Todas las categorías</option>
              {(storeType?.categories || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="product-grid">
            {filtered.length === 0 ? (
              <p className="muted">No hay productos. Ve a Productos y agrega algunos.</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  className="product-tile"
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                >
                  <strong>{p.name}</strong>
                  <span className="muted small">{p.category}</span>
                  <span className="price">{money(p.price)}</span>
                  <span className={`stock ${p.stock <= 5 ? "low" : ""}`}>
                    Stock: {p.stock} {p.unit}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="panel cart-panel">
          <h3>Carrito</h3>
          {cart.length === 0 ? (
            <p className="muted">Vacío. Toca un producto para agregarlo.</p>
          ) : (
            <div className="cart-list">
              {cart.map((i) => (
                <div key={i.productId} className="cart-item">
                  <div>
                    <strong>{i.name}</strong>
                    <div className="muted small">{money(i.price)} c/u</div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={i.stock}
                    value={i.qty}
                    onChange={(e) => setQty(i.productId, e.target.value)}
                  />
                  <strong>{money(i.price * i.qty)}</strong>
                  <button className="btn tiny danger" onClick={() => removeItem(i.productId)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="cart-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>

          <label className="field">
            <span>Cliente</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Cliente general"
            />
          </label>

          <label className="field">
            <span>Pago</span>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="yape">Yape / Plin</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>

          <label className="field">
            <span>Nota</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcional" />
          </label>

          <button className="btn primary full" onClick={checkout} disabled={loading || !cart.length}>
            {loading ? "Registrando..." : "Registrar venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
