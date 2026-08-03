import { useState } from "react";
import { api } from "../api";

export default function Settings({ config, storeType, onConfigChange }) {
  const [storeName, setStoreName] = useState(config.storeName);
  const [currency, setCurrency] = useState(config.currency);
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState(config.logo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  function onLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    try {
      const fd = new FormData();
      fd.append("storeName", storeName.trim());
      fd.append("currency", currency);
      if (logoFile) fd.append("logo", logoFile);
      const data = await api.updateConfig(fd);
      onConfigChange(data);
      setOk("Cambios guardados");
      setLogoFile(null);
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
          <p className="eyebrow">Configuración</p>
          <h1>Ajustes</h1>
          <p className="muted">Puedes cambiar nombre, logo y moneda. El tipo de tienda no.</p>
        </div>
      </header>

      {error && <div className="alert err">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      <div className="split">
        <form className="panel form-panel" onSubmit={save}>
          <h3>Identidad</h3>

          <label className="field">
            <span>Nombre de la tienda</span>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          </label>

          <label className="field">
            <span>Moneda</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="S/">S/ (Soles)</option>
              <option value="$">$ (Dólares)</option>
              <option value="€">€ (Euros)</option>
              <option value="MXN$">MXN$</option>
              <option value="COP$">COP$</option>
            </select>
          </label>

          <label className="field">
            <span>Logo</span>
            <input type="file" accept="image/*" onChange={onLogo} />
          </label>

          {preview && (
            <div className="logo-preview">
              <img src={preview} alt="Logo" />
            </div>
          )}

          <button className="btn primary" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        <div className="panel">
          <h3>Tipo de tienda (bloqueado)</h3>
          <div className="locked-type">
            <span className="type-icon big">{storeType?.icon}</span>
            <div>
              <strong>{storeType?.name}</strong>
              <p className="muted">{storeType?.description}</p>
              <p className="muted small">
                Bloqueado el {config.lockedAt ? new Date(config.lockedAt).toLocaleString() : "—"}
              </p>
            </div>
          </div>
          <div className="warn-box">
            El tipo de tienda no se puede cambiar para evitar inconsistencias en categorías y
            configuración del sistema.
          </div>
          <div className="summary-note">
            Categorías: {storeType?.categories?.join(", ")}
          </div>
        </div>
      </div>
    </div>
  );
}
