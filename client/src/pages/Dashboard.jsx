import { useEffect, useState } from "react";
import { api } from "../api";

export default function Dashboard({ config, storeType, onGo }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  const money = (n) => `${config.currency} ${Number(n || 0).toFixed(2)}`;

  return (
    <div className="page-block">
      <header className="page-head">
        <div>
          <p className="eyebrow">Panel</p>
          <h1>Hola, {config.storeName}</h1>
          <p className="muted">
            {storeType?.icon} {storeType?.name} · sistema listo para vender
          </p>
        </div>
        <button className="btn primary" onClick={() => onGo("sales")}>
          + Nueva venta
        </button>
      </header>

      {error && <div className="alert err">{error}</div>}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Ventas hoy</span>
          <strong>{stats?.salesToday ?? "—"}</strong>
        </article>
        <article className="stat-card">
          <span>Ingresos hoy</span>
          <strong>{stats ? money(stats.revenueToday) : "—"}</strong>
        </article>
        <article className="stat-card">
          <span>Productos activos</span>
          <strong>{stats?.products ?? "—"}</strong>
        </article>
        <article className="stat-card">
          <span>Stock bajo</span>
          <strong>{stats?.lowStock ?? "—"}</strong>
        </article>
      </div>

      <div className="quick-grid">
        <button className="quick-card" onClick={() => onGo("products")}>
          <h3>📦 Productos</h3>
          <p className="muted">Agrega catálogo y controla stock</p>
        </button>
        <button className="quick-card" onClick={() => onGo("sales")}>
          <h3>🧾 Cobrar</h3>
          <p className="muted">Registra una venta en segundos</p>
        </button>
        <button className="quick-card" onClick={() => onGo("history")}>
          <h3>📋 Historial</h3>
          <p className="muted">Revisa ventas anteriores</p>
        </button>
        <button className="quick-card" onClick={() => onGo("settings")}>
          <h3>⚙️ Ajustes</h3>
          <p className="muted">Nombre, logo y moneda</p>
        </button>
      </div>
    </div>
  );
}
