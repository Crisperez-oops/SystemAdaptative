async function request(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error en la solicitud");
  return data;
}

export const api = {
  setupStatus: () => request("/api/setup/status"),
  completeSetup: (formData) =>
    request("/api/setup", { method: "POST", body: formData }),
  getConfig: () => request("/api/config"),
  updateConfig: (formData) =>
    request("/api/config", { method: "PUT", body: formData }),
  products: () => request("/api/products"),
  createProduct: (body) =>
    request("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  updateProduct: (id, body) =>
    request(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  sales: () => request("/api/sales"),
  createSale: (body) =>
    request("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  stats: () => request("/api/stats"),
};
