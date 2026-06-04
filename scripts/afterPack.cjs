/**
 * scripts/afterPack.js
 *
 * Runs after electron-builder packs the app but before it creates
 * the installer. Installs production dependencies for the Express
 * backend inside the packaged resources directory.
 *
 * node-snap7 contains native binaries, so we install it fresh on the
 * build machine targeting the correct platform/arch rather than copying
 * pre-built binaries from the dev machine.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function afterPack({ appOutDir, packager }) {
  const serverDest = path.join(appOutDir, "resources", "server");

  if (!fs.existsSync(serverDest)) {
    console.warn("[afterPack] server directory not found at", serverDest);
    return;
  }

  console.log("[afterPack] installing server production deps in", serverDest);

  try {
    execSync("npm install --omit=dev --no-audit --no-fund", {
      cwd: serverDest,
      stdio: "inherit",
      env: {
        ...process.env,
        // Force node-snap7 to use the same Node ABI as Electron
        npm_config_runtime: "electron",
        npm_config_target: packager.config.electronVersion || "31.0.0",
        npm_config_target_arch: packager.platform.nodeName === "win32" ? "x64" : process.arch,
        npm_config_disturl: "https://electronjs.org/headers",
      },
    });
    console.log("[afterPack] server deps installed");
  } catch (e) {
    console.error("[afterPack] npm install failed:", e.message);
    throw e;
  }
};
