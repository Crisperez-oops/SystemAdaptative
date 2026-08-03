import { useEffect, useState } from "react";
import { api } from "./api";
import SetupWizard from "./pages/SetupWizard";
import Shell from "./pages/Shell";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);
  const [config, setConfig] = useState(null);
  const [storeType, setStoreType] = useState(null);
  const [storeTypes, setStoreTypes] = useState([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.setupStatus();
      setSetupComplete(data.setupComplete);
      setStoreTypes(data.storeTypes || []);
      if (data.setupComplete) {
        const full = await api.getConfig();
        setConfig(full.config);
        setStoreType(full.storeType);
      } else {
        setConfig(null);
        setStoreType(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>Cargando sistema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="center-screen">
        <h2>No se pudo conectar</h2>
        <p className="muted">{error}</p>
        <button className="btn primary" onClick={load}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <SetupWizard
        storeTypes={storeTypes}
        onDone={async () => {
          await load();
        }}
      />
    );
  }

  return (
    <Shell
      config={config}
      storeType={storeType}
      onConfigChange={(next) => {
        setConfig(next.config);
        setStoreType(next.storeType);
      }}
    />
  );
}
