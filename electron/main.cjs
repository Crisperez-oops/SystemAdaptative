const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const PORT = 3847;
let mainWindow = null;
let serverRef = null;

function getDataDir() {
  return path.join(app.getPath("userData"), "data");
}

function getAppRoot() {
  return app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");
}

function getClientDist() {
  return path.join(getAppRoot(), "client", "dist");
}

function getServerEntry() {
  return path.join(getAppRoot(), "server", "index.js");
}

async function startBackend() {
  process.env.ELECTRON = "1";
  process.env.DATA_DIR = getDataDir();
  process.env.CLIENT_DIST = getClientDist();
  process.env.PORT = String(PORT);

  fs.mkdirSync(process.env.DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(process.env.DATA_DIR, "uploads"), { recursive: true });

  const mod = await import(pathToFileURL(getServerEntry()).href);
  const result = await mod.startServer({
    port: PORT,
    dataDir: process.env.DATA_DIR,
    clientDist: process.env.CLIENT_DIST,
  });
  serverRef = result.server;
  return result.port;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await startBackend();
      createWindow();
    } catch (err) {
      console.error("No se pudo iniciar la app:", err);
      app.quit();
    }
  });
}

app.on("window-all-closed", () => {
  if (serverRef) {
    try {
      serverRef.close();
    } catch {}
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
