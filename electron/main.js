const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let mainWindow = null;
let backendProcess = null;

function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "server", "src", "index.js");
  }
  return path.join(__dirname, "..", "server", "src", "index.js");
}

function startBackend() {
  const serverEntry = getBackendPath();
  console.log("[electron] starting backend:", serverEntry);

  backendProcess = spawn(process.execPath, [serverEntry], {
    env: { ...process.env, PORT: "4000", ELECTRON_RUN_AS_NODE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  backendProcess.stdout.on("data", (d) => console.log("[backend]", d.toString().trim()));
  backendProcess.stderr.on("data", (d) => console.error("[backend]", d.toString().trim()));
  backendProcess.on("exit", (code) => console.warn("[backend] exited with code", code));
}

function stopBackend() {
  if (backendProcess) { backendProcess.kill(); backendProcess = null; }
}

function waitForBackend(port = 4000, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const check = () => {
      const req = http.get(`http://localhost:${port}/status`, (res) => { res.resume(); resolve(); });
      req.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("Backend timeout"));
        setTimeout(check, 300);
      });
      req.end();
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    title: "PLC Dialer Dash",
    backgroundColor: "#0f1117",
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, "preload.js") },
    autoHideMenuBar: true,
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist-spa", "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  startBackend();
  try {
    await waitForBackend();
    console.log("[electron] backend ready");
  } catch (e) {
    dialog.showErrorBox("Backend failed to start", "The PLC backend server could not be started.");
  }
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { stopBackend(); if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => { stopBackend(); });
