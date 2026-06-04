/**
 * Electron main process for PLC Dialer Dash
 * - Spawns the Express/node-snap7 backend on port 4000
 * - Opens a BrowserWindow loading the built React frontend
 */

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let mainWindow = null;
let backendProcess = null;

// ─── Backend ────────────────────────────────────────────────────────────────

function getBackendPath() {
  if (app.isPackaged) {
    // In production the server folder is bundled under resources/server
    return path.join(process.resourcesPath, "server", "src", "index.js");
  }
  return path.join(__dirname, "..", "server", "src", "index.js");
}

function getNodeBin() {
  // electron ships its own Node; use that only as a fallback.
  // node-snap7 needs a compatible native Node, so prefer the system one.
  return process.execPath; // electron's node — good enough for snap7 on Windows
}

function startBackend() {
  const serverEntry = getBackendPath();
  console.log("[electron] starting backend:", serverEntry);

  backendProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      PORT: "4000",
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  backendProcess.stdout.on("data", (d) =>
    console.log("[backend]", d.toString().trim())
  );
  backendProcess.stderr.on("data", (d) =>
    console.error("[backend]", d.toString().trim())
  );
  backendProcess.on("exit", (code) => {
    console.warn("[backend] exited with code", code);
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// Poll until the backend is accepting connections, then resolve.
function waitForBackend(port = 4000, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const check = () => {
      const req = http.get(`http://localhost:${port}/status`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("Backend timeout"));
        setTimeout(check, 300);
      });
      req.end();
    };
    check();
  });
}

// ─── Window ─────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "PLC Dialer Dash",
    backgroundColor: "#0f1117",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
    autoHideMenuBar: true,
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist-spa", "index.html"));
  } else {
    // Dev: vite dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  startBackend();

  try {
    await waitForBackend();
    console.log("[electron] backend ready");
  } catch (e) {
    console.error("[electron] backend did not start in time:", e.message);
    dialog.showErrorBox(
      "Backend failed to start",
      "The PLC backend server could not be started. Check that Node.js is installed and node-snap7 is built for your platform."
    );
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopBackend();
});
