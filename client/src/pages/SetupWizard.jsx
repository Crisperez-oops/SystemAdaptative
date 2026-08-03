import { useMemo, useState } from "react";
import { api } from "../api";

const STEPS = ["Bienvenida", "Identidad", "Tipo de tienda", "Confirmar"];

export default function SetupWizard({ storeTypes, onDone }) {
  const [step, setStep] = useState(0);
  const [storeName, setStoreName] = useState("");
  const [currency, setCurrency] = useState("S/");
  const [storeType, setStoreType] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedType = useMemo(
    () => storeTypes.find((t) => t.id === storeType) || null,
    [storeTypes, storeType]
  );

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function next() {
    setError("");
    if (step === 1) {
      if (!storeName.trim()) {
        setError("Escribe el nombre de tu tienda o negocio");
        return;
      }
    }
    if (step === 2) {
      if (!storeType) {
        setError("Selecciona un tipo de tienda. Esto no se podrá cambiar después.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("storeName", storeName.trim());
      fd.append("storeType", storeType);
      fd.append("currency", currency);
      if (logoFile) fd.append("logo", logoFile);
      await api.completeSetup(fd);
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wizard-page">
      <div className="wizard-card">
        <div className="wizard-top">
          <div>
            <p className="eyebrow">Configuración inicial</p>
            <h1>Crea tu sistema de ventas</h1>
          </div>
          <div className="step-pills">
            {STEPS.map((label, i) => (
              <span key={label} className={`pill ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="wizard-body">
            <h2>Bienvenido</h2>
            <p className="muted">
              Este asistente te permite armar tu página de ventas sin tocar código.
              Configura el nombre, logo y tipo de tienda. El tipo quedará bloqueado
              para mantener el sistema estable.
            </p>
            <ul className="checklist">
              <li>Nombre y logo de tu negocio</li>
              <li>Tipo de tienda (abarrotes, ropa, restaurante...)</li>
              <li>Productos, stock y registro de ventas</li>
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="wizard-body">
            <h2>Identidad de la tienda</h2>
            <p className="muted">Así se verá tu sistema. Puedes cambiar nombre y logo después.</p>

            <label className="field">
              <span>Nombre de la página / tienda *</span>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ej: MiniMarket El Sol"
                maxLength={80}
              />
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
              <span>Logo de la empresa (opcional)</span>
              <input type="file" accept="image/*" onChange={onLogoChange} />
            </label>

            {logoPreview && (
              <div className="logo-preview">
                <img src={logoPreview} alt="Vista previa del logo" />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="wizard-body">
            <h2>Tipo de tienda</h2>
            <p className="warn-box">
              Importante: una vez confirmado, el tipo de tienda <strong>no se podrá cambiar</strong>.
            </p>
            <div className="type-grid">
              {storeTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`type-card ${storeType === t.id ? "selected" : ""}`}
                  onClick={() => setStoreType(t.id)}
                >
                  <span className="type-icon">{t.icon}</span>
                  <strong>{t.name}</strong>
                  <span className="muted small">{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-body">
            <h2>Confirmar y bloquear</h2>
            <p className="muted">Revisa los datos. Al continuar se crea tu tienda.</p>
            <div className="summary">
              <div className="summary-brand">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" />
                ) : (
                  <div className="logo-fallback">{storeName.slice(0, 1).toUpperCase() || "T"}</div>
                )}
                <div>
                  <h3>{storeName || "Sin nombre"}</h3>
                  <p className="muted">
                    {selectedType?.icon} {selectedType?.name || "Sin tipo"} · Moneda {currency}
                  </p>
                </div>
              </div>
              <div className="summary-note">
                Categorías iniciales: {selectedType?.categories?.join(", ")}
              </div>
            </div>
          </div>
        )}

        {error && <div className="alert err">{error}</div>}

        <div className="wizard-actions">
          {step > 0 ? (
            <button className="btn ghost" onClick={back} disabled={loading}>
              Atrás
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn primary" onClick={next}>
              Continuar
            </button>
          ) : (
            <button className="btn primary" onClick={finish} disabled={loading}>
              {loading ? "Creando tienda..." : "Crear tienda y bloquear tipo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
