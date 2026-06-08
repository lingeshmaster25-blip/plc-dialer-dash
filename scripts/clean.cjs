/* eslint-disable */
// Cross-platform clean for Electron build artifacts.
// Used by `npm run electron:clean` so we don't depend on shell tricks.
const fs = require("fs");
const path = require("path");

const TARGETS = ["dist-spa", "dist-electron"];

for (const t of TARGETS) {
  const p = path.resolve(__dirname, "..", t);
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log("[clean] removed", t);
  } catch (e) {
    console.warn("[clean] could not remove", t, e.message);
  }
}
