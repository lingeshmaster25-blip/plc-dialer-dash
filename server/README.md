# Siemens S7-1200 HMI — Backend

Node.js + Express + [node-snap7](https://www.npmjs.com/package/node-snap7)
service that talks to a Siemens S7-1200 over Ethernet (ISO-on-TCP, port 102)
and exposes a simple REST API consumed by the React HMI in this same repo.

> This service uses a **native module** (`node-snap7`). It must be installed
> and run on your local machine or a server that can reach the PLC. It will
> not run inside the Lovable browser preview sandbox.

## Folder layout

```
server/
├── package.json
├── .env.example
└── src/
    ├── index.js        # Express API
    └── plcService.js   # node-snap7 wrapper (read/write/poll/auto-reconnect)
```

## Requirements

- **Node.js 18 or 20** (node-snap7 ships native binaries for these LTS lines).
- Build toolchain (Linux: `build-essential`, macOS: Xcode CLT, Windows: VS Build Tools)
  in case prebuilt binaries don't exist for your platform.
- Network access to the PLC (default port `102`).

## Install

```bash
cd server
cp .env.example .env
# edit .env: set PLC_IP to your S7-1200 IP
npm install
```

If `npm install` fails on `node-snap7`, install build tools and retry:

- **Ubuntu/Debian:** `sudo apt install -y build-essential python3`
- **macOS:** `xcode-select --install`
- **Windows:** `npm install --global windows-build-tools` (admin shell)

## Run

```bash
npm start          # production
npm run dev        # auto-reload via nodemon
```

You should see:

```
[HMI backend] listening on http://localhost:4000
[HMI backend] target PLC 192.168.0.1 rack=0 slot=1
[PLC] Connecting to 192.168.0.1 (rack=0, slot=1)…
[PLC] Connected.
```

## REST API

| Method | Path       | Body                          | Description                          |
| ------ | ---------- | ----------------------------- | ------------------------------------ |
| POST   | `/connect` | `{ ip, rack, slot }`          | Re-target and reconnect to a PLC     |
| GET    | `/status`  | —                             | Current snapshot (inputs/outputs/M)  |
| POST   | `/forward` | —                             | Sets `M0.0=1`, clears `M0.1`/`M0.2`  |
| POST   | `/reverse` | —                             | Sets `M0.1=1`, clears `M0.0`/`M0.2`  |
| POST   | `/stop`    | —                             | Sets `M0.2=1`, clears `M0.0`/`M0.1`  |

The backend polls **IB0**, **QB0** and **MB0** every `POLL_MS` (default 500 ms),
and **auto-reconnects** every 3 s on I/O failure.

### Status response

```json
{
  "connected": true,
  "ip": "192.168.0.1",
  "rack": 0,
  "slot": 1,
  "inputs":  { "startForward": false, "stop": false,
               "openLimit": false, "closeLimit": false, "startReverse": false },
  "outputs": { "forward": false, "reverse": false },
  "memory":  { "forwardCmd": false, "reverseCmd": false, "stopCmd": false },
  "simulated": false,
  "timestamp": 1716200000000
}
```

## PLC (TIA Portal) setup

1. **Device config → Protection & Security → Connection mechanisms:**
   enable **"Permit access with PUT/GET communication from remote partner"**.
2. **Device config → Properties → Protection:** uncheck
   **"Block communication"** (or set appropriate access level).
3. Assign a static IP in the same subnet as the PC running this backend.
4. (Optional but recommended) Add a small ladder program that uses the
   memory bits as command sources, e.g.:

   ```
   // Forward: latch from M0.0, dropped by Stop/Reverse/limit
   A "Q0.0"  := ("M0.0" OR "Q0.0") AND NOT "M0.2"
                AND NOT "Q0.1" AND NOT "I0.2"   // open-limit interlock
   A "Q0.1"  := ("M0.1" OR "Q0.1") AND NOT "M0.2"
                AND NOT "Q0.0" AND NOT "I0.3"   // close-limit interlock
   // Clear M0.2 after one scan
   A "M0.2"  := FALSE
   ```

   The HMI assumes the PLC enforces the Forward/Reverse interlock; the
   backend additionally prevents simultaneous command bits at write time.

## Example node-snap7 snippet

```js
const snap7 = require("node-snap7");
const c = new snap7.S7Client();
c.ConnectTo("192.168.0.1", 0, 1, (err) => {
  if (err) return console.error(c.ErrorText(err));
  c.ReadArea(c.S7AreaPE, 0, 0, 1, c.S7WLByte, (e, buf) => {
    console.log("IB0 =", buf[0].toString(2).padStart(8, "0"));
    c.Disconnect();
  });
});
```

## Connecting the frontend to this backend

The React frontend reads `VITE_HMI_API` at build/dev time. If you run the
frontend locally:

```bash
# from repo root
echo "VITE_HMI_API=http://localhost:4000" > .env.local
npm run dev
```

If the backend isn't reachable (e.g. you're viewing the Lovable preview),
the UI automatically switches to a **simulation mode** so you can still
interact with it — a `SIM` chip appears next to the connection indicator.
