import { useEffect, useState } from "react";
import { api } from "../api";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  price: "",
  cost: "",
  stock: "",
  unit: "unidad",
};

export default function Products({ config, storeType, onChange }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    ...emptyForm,
    category: storeType?.categories?.[0] || "Otros",
    unit: storeType?.units?.[0] || "unidad",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
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

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku || "",
      category: p.category,
      price: String(p.price),
      cost: String(p.cost ?? ""),
      stock: String(p.stock),
      unit: p.unit,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category: storeType?.categories?.[0] || "Otros",
      unit: storeType?.units?.[0] || "unidad",
    });
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        price: Number(form.price),
        cost: Number(form.cost || 0),
        stock: Number(form.stock || 0),
        unit: form.unit,
      };
      if (editingId) await api.updateProduct(editingId, payload);
      else await api.createProduct(payload);
      resetForm();
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await api.deleteProduct(id);
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    }
  }

  const money = (n) => `${config.currency} ${Number(n).toFixed(2)}`;

  return (
    <div className="page-block">
      <header className="page-head">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>Productos</h1>
          <p className="muted">Administra lo que vendes en tu tienda</p>
        </div>
      </header>

      {error && <div className="alert err">{error}</div>}

      <div className="split">
        <form className="panel form-panel" onSubmit={save}>
          <h3>{editingId ? "Editar producto" : "Nuevo producto"}</h3>

          <label className="field">
            <span>Nombre *</span>
            <input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
          </label>

          <div className="row-2">
            <label className="field">
              <span>SKU / código</span>
              <input value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
            </label>
            <label className="field">
              <span>Categoría</span>
              <select value={form.category} onChange={(e) => setField("category", e.target.value)}>
                {(storeType?.categories || ["Otros"]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="row-2">
            <label className="field">
              <span>Precio venta *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Costo</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setField("cost", e.target.value)}
              />
            </label>
          </div>

          <div className="row-2">
            <label className="field">
              <span>Stock</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Unidad</span>
              <select value={form.unit} onChange={(e) => setField("unit", e.target.value)}>
                {(storeType?.units || ["unidad"]).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-actions">
            {editingId && (
              <button type="button" className="btn ghost" onClick={resetForm}>
                Cancelar
              </button>
            )}
            <button className="btn primary" disabled={loading}>
              {loading ? "Guardando..." : editingId ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </form>

        <div className="panel">
          <h3>Lista ({products.length})</h3>
          {products.length === 0 ? (
            <p className="muted">Aún no hay productos. Agrega el primero.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={p.stock <= 5 ? "low" : ""}>
                      <td>
                        <strong>{p.name}</strong>
                        {p.sku && <div className="muted small">{p.sku}</div>}
                      </td>
                      <td>{p.category}</td>
                      <td>{money(p.price)}</td>
                      <td>
                        {p.stock} {p.unit}
                      </td>
                      <td className="actions">
                        <button className="btn tiny" onClick={() => startEdit(p)}>
                          Editar
                        </button>
                        <button className="btn tiny danger" onClick={() => remove(p.id)}>
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
