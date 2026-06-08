/**
 * Electron main process for PLC Dialer Dash
 * - Spawns the Express + node-snap7 backend on port 4000
 * - Opens a BrowserWindow loading the built React frontend
 *
 * Robustness:
 *  • Captures backend stdout/stderr to %APPDATA%\PLC Dialer Dash\logs\backend.log
 *  • If the backend fails, the dialog shows the real error
 *  • DevTools opens automatically when the frontend fails to load
 *  • Works both in dev (vite on :5173) and packaged (asar)
 */

const { app, BrowserWindow, dialog } = require("electron");
const path  = require("path");
const fs    = require("fs");
const { spawn } = require("child_process");
const http  = require("http");

let mainWindow = null;
let backendProcess = null;
let backendStderr = ""; // last few KB of backend stderr for error dialog

// ─── Logging ────────────────────────────────────────────────────────────────

const LOG_DIR = path.join(app.getPath("userData"), "logs");
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) {}
const LOG_FILE = path.join(LOG_DIR, "main.log");
const BACKEND_LOG = path.join(LOG_DIR, "backend.log");

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.map(String).join(" ")}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch (_) {}
  // also echo to stdout in dev
  // eslint-disable-next-line no-console
  console.log(...args);
}

process.on("uncaughtException", (e) => {
  log("uncaughtException:", e && e.stack ? e.stack : e);
  try {
    dialog.showErrorBox("PLC Dialer Dash — crash", String(e && e.stack ? e.stack : e));
  } catch (_) {}
});

// ─── Backend ────────────────────────────────────────────────────────────────

function getBackendPath() {
  if (app.isPackaged) {
    // extraResources copies server/ -> resources/server/
    return path.join(process.resourcesPath, "server", "src", "index.js");
  }
  return path.join(__dirname, "..", "server", "src", "index.js");
}

function killPort4000() {
  if (process.platform !== "win32") return;
  // Best-effort: kill any process still listening on 4000 (zombie from
  // a previous crashed backend). Failures are silent.
  try {
    const { execSync } = require("child_process");
    const out = execSync('netstat -ano -p tcp | findstr ":4000"', { stdio: ["ignore", "pipe", "ignore"] })
      .toString();
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const m = line.trim().match(/\s(\d+)$/);
      if (m) pids.add(m[1]);
    }
    for (const pid of pids) {
      try { execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" }); log("[backend] freed port 4000 (killed pid", pid, ")"); } catch (_) {}
    }
  } catch (_) { /* nothing on port — fine */ }
}

function startBackend() {
  const serverEntry = getBackendPath();
  log("[backend] starting:", serverEntry);
  if (!fs.existsSync(serverEntry)) {
    log("[backend] entry NOT FOUND");
    backendStderr = `Backend entry not found at:\n${serverEntry}`;
    return;
  }

  killPort4000();

  // Use Electron's own executable in node-mode so the rebuilt
  // node-snap7 binary (compiled against Electron's Node ABI) loads.
  // --no-experimental-sandbox disables V8's pointer sandbox so
  // node-snap7's older ArrayBuffer allocations don't FATAL-crash
  // the moment PLC data arrives.
  backendProcess = spawn(
    process.execPath,
    ["--no-experimental-sandbox", serverEntry],
    {
      cwd: path.dirname(serverEntry),
      env: {
        ...process.env,
        PORT: "4000",
        ELECTRON_RUN_AS_NODE: "1",
        NODE_OPTIONS: "--no-experimental-sandbox",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  const sink = fs.createWriteStream(BACKEND_LOG, { flags: "a" });
  sink.write(`\n\n===== backend start ${new Date().toISOString()} =====\n`);
  backendProcess.stdout.on("data", (d) => sink.write(d));
  backendProcess.stderr.on("data", (d) => {
    sink.write(d);
    backendStderr = (backendStderr + d.toString()).slice(-4000);
  });
  backendProcess.on("exit", (code, sig) => {
    log("[backend] exited code=", code, "sig=", sig);
    sink.write(`\n===== backend exit code=${code} sig=${sig} =====\n`);
    sink.end();
  });
  backendProcess.on("error", (err) => {
    log("[backend] spawn error:", err.message);
    backendStderr = (backendStderr + "\nspawn error: " + err.message).slice(-4000);
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch (_) {}
    backendProcess = null;
  }
}

// Poll until the backend is accepting connections.
function waitForBackend(port = 4000, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/status`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) {
          return reject(new Error("Backend did not respond on port " + port));
        }
        setTimeout(check, 400);
      });
      req.setTimeout(2000, () => req.destroy());
    };
    check();
  });
}

// ─── Window ─────────────────────────────────────────────────────────────────

function indexHtmlPath() {
  // Vite outputs the bundled HTML using the source filename — our entry
  // is index.electron.html, so the built file keeps that name.
  const electronHtml = path.join(__dirname, "..", "dist-spa", "index.electron.html");
  const plainHtml    = path.join(__dirname, "..", "dist-spa", "index.html");
  return fs.existsSync(electronHtml) ? electronHtml : plainHtml;
}

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

  // Surface renderer failures in our log + open DevTools so the user can see
  mainWindow.webContents.on("did-fail-load", (_e, errCode, errDesc, url) => {
    log("[renderer] did-fail-load:", errCode, errDesc, url);
    try { mainWindow.webContents.openDevTools({ mode: "detach" }); } catch (_) {}
  });
  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    log("[renderer] render-process-gone:", JSON.stringify(details));
  });

  if (app.isPackaged) {
    const indexPath = indexHtmlPath();
    log("[window] loading file:", indexPath, "exists?", fs.existsSync(indexPath));
    if (!fs.existsSync(indexPath)) {
      dialog.showErrorBox(
        "Frontend missing",
        `Could not find:\n${indexPath}\n\nThe SPA build (dist-spa) was not bundled.`,
      );
    }
    mainWindow.loadFile(indexPath).catch((err) => {
      log("[window] loadFile failed:", err.message);
      try { mainWindow.webContents.openDevTools({ mode: "detach" }); } catch (_) {}
    });
    // TEMP: open DevTools docked to the bottom (more reliable than detach).
    try { mainWindow.webContents.openDevTools({ mode: "bottom" }); } catch (_) {}
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }

  // Pipe renderer console messages into our log file too.
  mainWindow.webContents.on("console-message", (_e, level, message, line, sourceId) => {
    log(`[renderer:${level}] ${message}  (${sourceId}:${line})`);
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ─── App lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  log("app ready, isPackaged=", app.isPackaged, "userData=", app.getPath("userData"));

  startBackend();

  try {
    await waitForBackend();
    log("[backend] ready on :4000");
  } catch (e) {
    log("[backend] timeout:", e.message);
    const detail =
      "The PLC backend server could not be started.\n\n" +
      "Logs:  " + BACKEND_LOG + "\n\n" +
      "Last backend output:\n" + (backendStderr || "(no output captured)");
    dialog.showErrorBox("Backend failed to start", detail);
    // Continue and open the window anyway — the UI will fall back to the
    // built-in simulator so the operator at least sees something.
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

app.on("before-quit", () => { stopBackend(); });
