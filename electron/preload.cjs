// Preload — context bridge between renderer and main.
// The HMI frontend talks directly to http://localhost:4000 via fetch,
// so no special IPC is needed here. This file is kept for future use.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
});
