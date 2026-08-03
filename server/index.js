import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { STORE_TYPES, getStoreType } from "./storeTypes.js";
import {
  setDataDir,
  isSetupComplete,
  getConfig,
  completeSetup,
  updateConfig,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createSale,
  listSales,
  getSale,
  getStats,
  getUploadsDir,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(options = {}) {
  if (options.dataDir) setDataDir(options.dataDir);
  else if (process.env.DATA_DIR) setDataDir(process.env.DATA_DIR);

  const uploadsDir = getUploadsDir();
  const clientDist =
    options.clientDist ||
    process.env.CLIENT_DIST ||
    path.join(__dirname, "../client/dist");

  const app = express();

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".png";
      cb(null, `logo-${Date.now()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Solo se permiten imágenes"));
      }
      cb(null, true);
    },
  });

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  function requireSetup(req, res, next) {
    if (!isSetupComplete()) {
      return res.status(403).json({ error: "Completa la configuración inicial primero" });
    }
    next();
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, message: "API OK", time: new Date().toISOString() });
  });

  app.get("/api/store-types", (_req, res) => {
    res.json(Object.values(STORE_TYPES));
  });

  app.get("/api/setup/status", (_req, res) => {
    const complete = isSetupComplete();
    res.json({
      setupComplete: complete,
      config: complete ? getConfig() : null,
      storeTypes: Object.values(STORE_TYPES),
    });
  });

  app.post("/api/setup", upload.single("logo"), (req, res) => {
    try {
      if (isSetupComplete()) {
        return res.status(400).json({ error: "La configuración ya está bloqueada" });
      }

      const storeName = (req.body.storeName || "").trim();
      const storeType = req.body.storeType;
      const currency = (req.body.currency || "S/").trim();

      if (!storeName) return res.status(400).json({ error: "El nombre de la tienda es obligatorio" });
      if (!getStoreType(storeType)) return res.status(400).json({ error: "Tipo de tienda inválido" });

      const logo = req.file ? `/uploads/${req.file.filename}` : null;
      const config = completeSetup({ storeName, storeType, currency, logo });
      const type = getStoreType(storeType);

      res.json({ config, storeType: type });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/config", requireSetup, (_req, res) => {
    const config = getConfig();
    res.json({ config, storeType: getStoreType(config.storeType) });
  });

  app.put("/api/config", requireSetup, upload.single("logo"), (req, res) => {
    try {
      const payload = {};
      if (req.body.storeName !== undefined) payload.storeName = req.body.storeName;
      if (req.body.currency !== undefined) payload.currency = req.body.currency;
      if (req.file) payload.logo = `/uploads/${req.file.filename}`;
      const config = updateConfig(payload);
      res.json({ config, storeType: getStoreType(config.storeType) });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/products", requireSetup, (_req, res) => {
    res.json(listProducts());
  });

  app.post("/api/products", requireSetup, (req, res) => {
    try {
      const { name, price } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Nombre obligatorio" });
      if (price === undefined || Number(price) < 0) {
        return res.status(400).json({ error: "Precio inválido" });
      }
      res.status(201).json(createProduct(req.body));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", requireSetup, (req, res) => {
    const product = updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  });

  app.delete("/api/products/:id", requireSetup, (req, res) => {
    const ok = deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ ok: true });
  });

  app.get("/api/sales", requireSetup, (_req, res) => {
    res.json(listSales());
  });

  app.get("/api/sales/:id", requireSetup, (req, res) => {
    const sale = getSale(req.params.id);
    if (!sale) return res.status(404).json({ error: "Venta no encontrada" });
    res.json(sale);
  });

  app.post("/api/sales", requireSetup, (req, res) => {
    try {
      const sale = createSale(req.body);
      res.status(201).json(sale);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/stats", requireSetup, (_req, res) => {
    res.json(getStats());
  });

  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) res.status(404).json({ error: "Frontend no construido" });
    });
  });

  app.use((err, _req, res, _next) => {
    res.status(400).json({ error: err.message || "Error en la solicitud" });
  });

  return app;
}

export function startServer(options = {}) {
  const port = options.port || process.env.PORT || 3001;
  const app = createApp(options);
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1", () => {
      console.log(`Servidor en http://127.0.0.1:${port}`);
      resolve({ app, server, port });
    });
    server.on("error", reject);
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun && process.env.ELECTRON !== "1") {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
