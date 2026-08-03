import { Fragment, useEffect, useState } from "react";
import { api } from "../api";

export default function History({ config }) {
  const [sales, setSales] = useState([]);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api
      .sales()
      .then(setSales)
      .catch((e) => setError(e.message));
  }, []);

  const money = (n) => `${config.currency} ${Number(n).toFixed(2)}`;

  return (
    <div className="page-block">
      <header className="page-head">
        <div>
          <p className="eyebrow">Ventas</p>
          <h1>Historial</h1>
          <p className="muted">{sales.length} ventas registradas</p>
        </div>
      </header>

      {error && <div className="alert err">{error}</div>}

      <div className="panel">
        {sales.length === 0 ? (
          <p className="muted">Aún no hay ventas.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <Fragment key={s.id}>
                    <tr>
                      <td>#{s.number}</td>
                      <td>{new Date(s.createdAt).toLocaleString()}</td>
                      <td>{s.customerName}</td>
                      <td className="cap">{s.paymentMethod}</td>
                      <td>
                        <strong>{money(s.total)}</strong>
                      </td>
                      <td>
                        <button
                          className="btn tiny"
                          onClick={() => setOpenId(openId === s.id ? null : s.id)}
                        >
                          {openId === s.id ? "Ocultar" : "Ver"}
                        </button>
                      </td>
                    </tr>
                    {openId === s.id && (
                      <tr className="detail-row">
                        <td colSpan={6}>
                          <ul className="sale-items">
                            {s.items.map((i, idx) => (
                              <li key={idx}>
                                {i.qty} × {i.name} — {money(i.lineTotal)}
                              </li>
                            ))}
                          </ul>
                          {s.note && <p className="muted">Nota: {s.note}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
