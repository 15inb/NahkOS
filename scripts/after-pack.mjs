import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export default async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;

  const root = context.packager.projectDir;
  const rcedit = path.join(root, "node_modules", "electron-winstaller", "vendor", "rcedit.exe");
  const icon = path.join(root, "assets", "icon.ico");
  const appExe = path.join(context.appOutDir, "NahkriinOS.exe");

  if (!existsSync(rcedit)) throw new Error(`rcedit.exe was not found at ${rcedit}`);
  if (!existsSync(icon)) throw new Error(`Icon was not found at ${icon}`);
  if (!existsSync(appExe)) throw new Error(`Packaged app executable was not found at ${appExe}`);

  const result = spawnSync(rcedit, [appExe, "--set-icon", icon], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Failed to stamp NahkriinOS icon on ${appExe}`);
  console.log(`[after-pack] Stamped NahkriinOS app icon: ${appExe}`);
}
