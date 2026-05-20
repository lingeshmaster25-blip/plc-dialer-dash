interface Props {
  connected: boolean;
  ip: string;
  rack: number;
  slot: number;
  simulated?: boolean;
}

export function ConnectionStatus({ connected, ip, rack, slot, simulated }: Props) {
  return (
    <div className="panel-bevel rounded-md px-4 py-3 flex items-center gap-3">
      <div className="relative flex items-center justify-center h-3 w-3">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            connected ? "bg-[var(--hmi-green)] animate-ping" : "bg-[var(--hmi-red)]"
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${
            connected ? "bg-[var(--hmi-green)]" : "bg-[var(--hmi-red)]"
          }`}
        />
      </div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">PLC Link</div>
        <div className="font-mono text-sm">
          {connected ? "ONLINE" : "OFFLINE"} · {ip} · R{rack}/S{slot}
        </div>
      </div>
      {simulated && (
        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-[var(--hmi-amber)]/20 text-[var(--hmi-amber)] ring-1 ring-[var(--hmi-amber)]/40">
          SIM
        </span>
      )}
    </div>
  );
}
