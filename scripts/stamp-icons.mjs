import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rcedit = path.join(root, "node_modules", "electron-winstaller", "vendor", "rcedit.exe");
const icon = path.join(root, "assets", "icon.ico");
const targets = [
  path.join(root, "release", "win-unpacked", "NahkriinOS.exe"),
  path.join(root, "release", "NahkriinOS-Portable-1.0.0-x64.exe"),
  path.join(root, "release", "NahkriinOS-Setup-1.0.0-x64.exe")
];

if (!existsSync(rcedit)) throw new Error(`rcedit.exe was not found at ${rcedit}`);
if (!existsSync(icon)) throw new Error(`Icon was not found at ${icon}`);

for (const target of targets) {
  if (!existsSync(target)) {
    console.warn(`[stamp-icons] Skipping missing target: ${target}`);
    continue;
  }
  const result = spawnSync(rcedit, [target, "--set-icon", icon], { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`[stamp-icons] Failed to stamp icon on ${target}`);
  }
  console.log(`[stamp-icons] Stamped NahkriinOS icon: ${target}`);
}
