import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { hmiApi, type PlcStatus } from "@/lib/hmi-api";
import { ConnectionStatus } from "@/components/hmi/ConnectionStatus";
import { EventLog, type LogEntry } from "@/components/hmi/EventLog";
import { SettingsPanel } from "@/components/hmi/SettingsPanel";
import { ForcePanel } from "@/components/hmi/ForcePanel";
import { StageBinsPanel } from "@/components/hmi/StageBinsPanel";
import { MonitorPanel } from "@/components/hmi/MonitorPanel";
import { OutputStatusPanel } from "@/components/hmi/OutputStatusPanel";
import { SensorStatusPanel } from "@/components/hmi/SensorStatusPanel";

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

  // Poll status every 500ms — drives real-time monitor + sensor lamps
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await hmiApi.status();
        if (cancelled) return;
        const prev = prevRef.current;
        if (prev) {
          if (prev.connected !== s.connected) {
            addLog(
              s.connected ? "ok" : "error",
              `PLC ${s.connected ? "connected" : "disconnected"}`,
            );
          }
        } else {
          addLog(
            "info",
            hmiApi.isSimulated()
              ? "Running in simulation mode (backend unreachable)"
              : "Backend reachable",
          );
        }
        prevRef.current = s;
        setStatus(s);
      } catch (e) {
        addLog("error", `Status poll failed: ${(e as Error).message}`);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
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

  const handleForce = useCallback(
    async (tag: string, value: boolean) => {
      try {
        await hmiApi.writeTag(tag, value);
        addLog("info", `Force ${tag} = ${value ? "1" : "0"}`);
      } catch (e) {
        addLog("error", `Force ${tag} failed: ${(e as Error).message}`);
      }
    },
    [addLog],
  );

  const handleStageWrite = useCallback(
    async (tag: string, value: number) => {
      try {
        await hmiApi.writeTag(tag, value);
        addLog("info", `${tag} = ${value}`);
      } catch (e) {
        addLog("error", `Write ${tag} failed: ${(e as Error).message}`);
      }
    },
    [addLog],
  );

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
        {/* Left column: controls + status */}
        <section className="lg:col-span-2 space-y-6">
          <SettingsPanel
            ip={status?.ip ?? "192.168.0.1"}
            rack={status?.rack ?? 0}
            slot={status?.slot ?? 1}
            onConnect={handleConnect}
            connecting={connecting}
          />

          <ForcePanel
            tags={status?.tags}
            disabled={!connected}
            onWrite={handleForce}
            onDisconnect={handleDisconnect}
          />

          <StageBinsPanel
            tags={status?.tags}
            disabled={!connected}
            onWrite={handleStageWrite}
          />

          <MonitorPanel tags={status?.tags} />

          <OutputStatusPanel tags={status?.tags} />

          <SensorStatusPanel tags={status?.tags} />
        </section>

        {/* Right column: log + telemetry */}
        <aside className="space-y-6">
          <EventLog entries={log} />
          <div className="panel-bevel rounded-md p-4 text-xs space-y-2 font-mono">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Telemetry
            </h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Poll rate</span>
              <span>500 ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last update</span>
              <span>
                {status
                  ? new Date(status.timestamp).toLocaleTimeString()
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span>{status?.simulated ? "Simulation" : "Live"}</span>
            </div>
            {status?.lastError && (
              <div className="text-red-400 break-words">
                Err: {status.lastError}
              </div>
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
