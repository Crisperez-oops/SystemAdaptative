import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDataDir() {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  return path.join(__dirname, "data");
}

let DATA_DIR = resolveDataDir();
let UPLOADS_DIR = path.join(DATA_DIR, "uploads");
let DB_FILE = path.join(DATA_DIR, "db.json");

export function setDataDir(dir) {
  DATA_DIR = dir;
  UPLOADS_DIR = path.join(DATA_DIR, "uploads");
  DB_FILE = path.join(DATA_DIR, "db.json");
  ensureDirs();
}

const defaultDb = () => ({
  setupComplete: false,
  config: {
    storeName: "",
    logo: null,
    storeType: null,
    currency: "S/",
    lockedAt: null,
  },
  products: [],
  sales: [],
});

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readDb() {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const db = defaultDb();
    writeDb(db);
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  ensureDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export function getDb() {
  return readDb();
}

export function getConfig() {
  return readDb().config;
}

export function isSetupComplete() {
  return readDb().setupComplete === true;
}

export function completeSetup({ storeName, storeType, currency, logo }) {
  const db = readDb();
  if (db.setupComplete) {
    throw new Error("La configuración ya fue completada y el tipo de tienda no se puede cambiar");
  }
  db.config = {
    storeName: storeName.trim(),
    storeType,
    currency: currency || "S/",
    logo: logo || null,
    lockedAt: new Date().toISOString(),
  };
  db.setupComplete = true;
  writeDb(db);
  return db.config;
}

export function updateConfig({ storeName, currency, logo }) {
  const db = readDb();
  if (!db.setupComplete) throw new Error("Primero completa la configuración inicial");
  if (storeName !== undefined) db.config.storeName = storeName.trim();
  if (currency !== undefined) db.config.currency = currency;
  if (logo !== undefined) db.config.logo = logo;
  writeDb(db);
  return db.config;
}

export function listProducts() {
  return readDb().products.sort((a, b) => a.name.localeCompare(b.name));
}

export function createProduct(data) {
  const db = readDb();
  const product = {
    id: uuid(),
    name: data.name.trim(),
    sku: (data.sku || "").trim(),
    category: data.category || "Otros",
    price: Number(data.price) || 0,
    cost: Number(data.cost) || 0,
    stock: Number(data.stock) || 0,
    unit: data.unit || "unidad",
    active: data.active !== false,
    createdAt: new Date().toISOString(),
  };
  db.products.push(product);
  writeDb(db);
  return product;
}

export function updateProduct(id, data) {
  const db = readDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const prev = db.products[idx];
  db.products[idx] = {
    ...prev,
    name: data.name !== undefined ? data.name.trim() : prev.name,
    sku: data.sku !== undefined ? data.sku.trim() : prev.sku,
    category: data.category !== undefined ? data.category : prev.category,
    price: data.price !== undefined ? Number(data.price) : prev.price,
    cost: data.cost !== undefined ? Number(data.cost) : prev.cost,
    stock: data.stock !== undefined ? Number(data.stock) : prev.stock,
    unit: data.unit !== undefined ? data.unit : prev.unit,
    active: data.active !== undefined ? Boolean(data.active) : prev.active,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.products[idx];
}

export function deleteProduct(id) {
  const db = readDb();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  writeDb(db);
  return db.products.length < before;
}

export function createSale({ items, customerName, paymentMethod, note }) {
  const db = readDb();
  if (!items?.length) throw new Error("La venta necesita al menos un producto");

  const saleItems = [];
  let total = 0;

  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);
    if (!product.active) throw new Error(`Producto inactivo: ${product.name}`);
    const qty = Number(item.qty);
    if (!qty || qty <= 0) throw new Error("Cantidad inválida");
    if (product.stock < qty) {
      throw new Error(`Stock insuficiente de "${product.name}" (disponible: ${product.stock})`);
    }
    const lineTotal = +(product.price * qty).toFixed(2);
    total += lineTotal;
    saleItems.push({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      qty,
      lineTotal,
    });
    product.stock = +(product.stock - qty).toFixed(3);
  }

  const sale = {
    id: uuid(),
    number: db.sales.length + 1,
    items: saleItems,
    total: +total.toFixed(2),
    customerName: (customerName || "Cliente general").trim(),
    paymentMethod: paymentMethod || "efectivo",
    note: (note || "").trim(),
    createdAt: new Date().toISOString(),
  };

  db.sales.unshift(sale);
  writeDb(db);
  return sale;
}

export function listSales() {
  return readDb().sales;
}

export function getSale(id) {
  return readDb().sales.find((s) => s.id === id) || null;
}

export function getStats() {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  const salesToday = db.sales.filter((s) => s.createdAt.startsWith(today));
  const revenueToday = salesToday.reduce((sum, s) => sum + s.total, 0);
  const revenueAll = db.sales.reduce((sum, s) => sum + s.total, 0);
  const lowStock = db.products.filter((p) => p.active && p.stock <= 5).length;

  return {
    products: db.products.filter((p) => p.active).length,
    salesCount: db.sales.length,
    salesToday: salesToday.length,
    revenueToday: +revenueToday.toFixed(2),
    revenueAll: +revenueAll.toFixed(2),
    lowStock,
  };
}

export function getUploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

export { DATA_DIR, UPLOADS_DIR };
