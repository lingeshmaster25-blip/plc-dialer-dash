import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { hmiApi, type PlcStatus } from "@/lib/hmi-api";
import { ConnectionStatus } from "@/components/hmi/ConnectionStatus";
import { ControlButton } from "@/components/hmi/ControlButton";
import { StatusLamp } from "@/components/hmi/StatusLamp";
import { EventLog, type LogEntry } from "@/components/hmi/EventLog";
import { SettingsPanel } from "@/components/hmi/SettingsPanel";
import { TagPanel } from "@/components/hmi/TagPanel";

export const Route = createFileRoute("/")({
  component: HmiDashboard,
});

function HmiDashboard() {
  const [status, setStatus] = useState<PlcStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const prevRef = useRef<PlcStatus | null>(null);

  const addLog = useCallback((level: LogEntry["level"], message: string) => {
    setLog((l) => [{ ts: Date.now(), level, message }, ...l].slice(0, 200));
  }, []);

  // Poll status every 500ms
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await hmiApi.status();
        if (cancelled) return;
        // Diff for event log
        const prev = prevRef.current;
        if (prev) {
          if (prev.connected !== s.connected) {
            addLog(s.connected ? "ok" : "error", `PLC ${s.connected ? "connected" : "disconnected"}`);
          }
          if (prev.outputs.forward !== s.outputs.forward)
            addLog("info", `Q0.0 Forward = ${s.outputs.forward ? "ON" : "OFF"}`);
          if (prev.outputs.reverse !== s.outputs.reverse)
            addLog("info", `Q0.1 Reverse = ${s.outputs.reverse ? "ON" : "OFF"}`);
          if (prev.inputs.openLimit !== s.inputs.openLimit && s.inputs.openLimit)
            addLog("warn", "I0.2 Open limit switch reached");
          if (prev.inputs.closeLimit !== s.inputs.closeLimit && s.inputs.closeLimit)
            addLog("warn", "I0.3 Close limit switch reached");
        } else {
          addLog("info", hmiApi.isSimulated() ? "Running in simulation mode (backend unreachable)" : "Backend reachable");
        }
        prevRef.current = s;
        setStatus(s);
      } catch (e) {
        addLog("error", `Status poll failed: ${(e as Error).message}`);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => { cancelled = true; clearInterval(id); };
  }, [addLog]);

  const handleConnect = async (ip: string, rack: number, slot: number) => {
    setConnecting(true);
    addLog("info", `Connecting to ${ip} (rack=${rack}, slot=${slot})…`);
    try {
      const r = await hmiApi.connect(ip, rack, slot);
      addLog(r.ok ? "ok" : "error", r.message);
    } catch (e) {
      addLog("error", `Connect failed: ${(e as Error).message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleCmd = async (cmd: "forward" | "reverse" | "stop") => {
    addLog("info", `Command: ${cmd.toUpperCase()}`);
    try {
      await hmiApi[cmd]();
    } catch (e) {
      addLog("error", `${cmd} failed: ${(e as Error).message}`);
    }
  };

  const handleDisconnect = async () => {
    addLog("info", "Disconnecting from PLC…");
    try {
      const r = await hmiApi.disconnect();
      addLog(r.ok ? "ok" : "error", r.message);
    } catch (e) {
      addLog("error", `Disconnect failed: ${(e as Error).message}`);
    }
  };

  const connected = status?.connected ?? false;
  const fwd = status?.outputs.forward ?? false;
  const rev = status?.outputs.reverse ?? false;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header bar */}
      <header className="border-b border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded bg-primary/20 ring-1 ring-primary/40 flex items-center justify-center font-bold text-primary">
              S7
            </div>
            <div>
              <h1 className="text-base font-bold uppercase tracking-widest">
                Siemens S7-1200 HMI
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground">
                Industrial Motor Control · Ethernet / S7 Protocol
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <ConnectionStatus
              connected={connected}
              ip={status?.ip ?? "—"}
              rack={status?.rack ?? 0}
              slot={status?.slot ?? 1}
              simulated={status?.simulated}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: controls */}
        <section className="lg:col-span-2 space-y-6">
          <SettingsPanel
            ip={status?.ip ?? "192.168.0.1"}
            rack={status?.rack ?? 0}
            slot={status?.slot ?? 1}
            onConnect={handleConnect}
            connecting={connecting}
          />

          {/* Controls panel */}
          <div className="panel-bevel rounded-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
                Motor Control
              </h2>
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-mono text-muted-foreground">
                  M0.0/M0.1/M0.2
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={!connected}
                  className="bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded px-3 py-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ring-1 ring-red-900"
                >
                  Disconnect
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center justify-items-center">
              <ControlButton
                variant="forward"
                label="Forward"
                sublabel="WRITE M0.0"
                active={fwd}
                disabled={!connected || rev}
                onClick={() => handleCmd("forward")}
              />
              <ControlButton
                variant="estop"
                label="STOP"
                sublabel="WRITE M0.2"
                disabled={!connected}
                onClick={() => handleCmd("stop")}
              />
              <ControlButton
                variant="reverse"
                label="Reverse"
                sublabel="WRITE M0.1"
                active={rev}
                disabled={!connected || fwd}
                onClick={() => handleCmd("reverse")}
              />
            </div>
            {fwd && rev && (
              <p className="mt-4 text-center text-xs text-red-400 font-mono uppercase tracking-widest">
                Interlock fault: Forward and Reverse asserted
              </p>
            )}
          </div>

          {/* Status lamps */}
          <div className="panel-bevel rounded-md p-6">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-5">
              Status Indicators
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatusLamp
                label="Forward Running"
                tag="Q0.0"
                active={fwd}
                color="green"
                pulse
              />
              <StatusLamp
                label="Reverse Running"
                tag="Q0.1"
                active={rev}
                color="blue"
                pulse
              />
              <StatusLamp
                label="Open Limit Switch"
                tag="I0.2"
                active={status?.inputs.openLimit ?? false}
                color="amber"
              />
              <StatusLamp
                label="Close Limit Switch"
                tag="I0.3"
                active={status?.inputs.closeLimit ?? false}
                color="amber"
              />
            </div>
          </div>

          {/* Raw I/O */}
          <div className="panel-bevel rounded-md p-6">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Raw I/O Map
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              {[
                ["I0.0 StartFwd", status?.inputs.startForward],
                ["I0.1 Stop", status?.inputs.stop],
                ["I0.2 OpenLim", status?.inputs.openLimit],
                ["I0.3 CloseLim", status?.inputs.closeLimit],
                ["I0.4 StartRev", status?.inputs.startReverse],
                ["Q0.0 Forward", status?.outputs.forward],
                ["Q0.1 Reverse", status?.outputs.reverse],
                ["M0.0 FwdCmd", status?.memory.forwardCmd],
                ["M0.1 RevCmd", status?.memory.reverseCmd],
                ["M0.2 StopCmd", status?.memory.stopCmd],
              ].map(([label, on]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between bg-black/40 rounded px-3 py-2 ring-1 ring-white/5"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      on
                        ? "bg-[var(--hmi-green)]/20 text-[var(--hmi-green)]"
                        : "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {on ? "1" : "0"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <TagPanel tags={status?.tags} />
        </section>

        {/* Right column: log */}
        <aside className="space-y-6">
          <EventLog entries={log} />
          <div className="panel-bevel rounded-md p-4 text-xs space-y-2 font-mono">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Telemetry
            </h3>
            <div className="flex justify-between"><span className="text-muted-foreground">Poll rate</span><span>500 ms</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Last update</span><span>{status ? new Date(status.timestamp).toLocaleTimeString() : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span>{status?.simulated ? "Simulation" : "Live"}</span></div>
            {status?.lastError && (
              <div className="text-red-400 break-words">Err: {status.lastError}</div>
            )}
          </div>
        </aside>
      </div>

      <footer className="border-t border-white/10 mt-6">
        <div className="max-w-7xl mx-auto px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>S7-1200 · Rack 0 · Slot 1 · Port 102</span>
          <span>node-snap7 · ISO-on-TCP</span>
        </div>
      </footer>
    </main>
  );
}
