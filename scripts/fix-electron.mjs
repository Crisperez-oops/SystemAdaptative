import extract from "extract-zip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const zip =
  process.env.ELECTRON_ZIP ||
  path.join(
    process.env.LOCALAPPDATA,
    "electron",
    "Cache",
    "4b68eaf4436f7aef50e7ee3420fffb7d91683991ae01fe86868eee89d536adf9",
    "electron-v35.1.2-win32-x64.zip"
  );
const dist = path.join(root, "node_modules", "electron", "dist");

if (!fs.existsSync(zip)) {
  console.error("No se encontro el zip de Electron:", zip);
  process.exit(1);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

await extract(zip, { dir: dist });
fs.writeFileSync(path.join(root, "node_modules", "electron", "path.txt"), "electron.exe");
fs.writeFileSync(path.join(dist, "version"), "35.1.2");
console.log("Electron listo");
console.log(fs.readdirSync(dist).slice(0, 20));
