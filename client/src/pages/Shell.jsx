import { useState } from "react";
import Dashboard from "./Dashboard";
import Products from "./Products";
import Sales from "./Sales";
import History from "./History";
import Settings from "./Settings";

const NAV = [
  { id: "dashboard", label: "Inicio", icon: "🏠" },
  { id: "sales", label: "Nueva venta", icon: "🧾" },
  { id: "products", label: "Productos", icon: "📦" },
  { id: "history", label: "Historial", icon: "📋" },
  { id: "settings", label: "Ajustes", icon: "⚙️" },
];

export default function Shell({ config, storeType, onConfigChange }) {
  const [page, setPage] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  function bump() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          {config.logo ? (
            <img src={config.logo} alt="Logo" className="brand-logo" />
          ) : (
            <div className="brand-fallback">{config.storeName.slice(0, 1).toUpperCase()}</div>
          )}
          <div>
            <strong>{config.storeName}</strong>
            <p className="muted small">
              {storeType?.icon} {storeType?.name}
            </p>
          </div>
        </div>

        <nav className="side-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => setPage(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="side-foot">
          <span className="lock-badge">🔒 Tipo de tienda bloqueado</span>
        </div>
      </aside>

      <main className="main">
        {page === "dashboard" && (
          <Dashboard key={`d-${refreshKey}`} config={config} storeType={storeType} onGo={setPage} />
        )}
        {page === "sales" && (
          <Sales key={`s-${refreshKey}`} config={config} storeType={storeType} onSold={bump} />
        )}
        {page === "products" && (
          <Products key={`p-${refreshKey}`} config={config} storeType={storeType} onChange={bump} />
        )}
        {page === "history" && <History key={`h-${refreshKey}`} config={config} />}
        {page === "settings" && (
          <Settings config={config} storeType={storeType} onConfigChange={onConfigChange} />
        )}
      </main>
    </div>
  );
}
