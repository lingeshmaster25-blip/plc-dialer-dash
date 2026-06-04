const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function afterPack({ appOutDir, packager }) {
  const serverDest = path.join(appOutDir, "resources", "server");
  if (!fs.existsSync(serverDest)) { console.warn("[afterPack] server not found"); return; }

  console.log("[afterPack] installing server deps in", serverDest);
  execSync("npm install --omit=dev --no-audit --no-fund", {
    cwd: serverDest,
    stdio: "inherit",
    env: {
      ...process.env,
      npm_config_runtime: "electron",
      npm_config_target: packager.config.electronVersion || "31.0.0",
      npm_config_target_arch: "x64",
      npm_config_disturl: "https://electronjs.org/headers",
    },
  });
};
