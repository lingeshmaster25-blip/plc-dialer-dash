export type LogEntry = {
  ts: number;
  level: "info" | "warn" | "error" | "ok";
  message: string;
};

interface Props {
  entries: LogEntry[];
}

const levelStyle: Record<LogEntry["level"], string> = {
  info: "text-sky-400",
  warn: "text-amber-400",
  error: "text-red-400",
  ok: "text-emerald-400",
};

function fmt(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour12: false }) +
    "." + String(d.getMilliseconds()).padStart(3, "0");
}

export function EventLog({ entries }: Props) {
  return (
    <div className="panel-bevel rounded-md flex flex-col h-full">
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Event Log</h3>
        <span className="text-[10px] font-mono text-muted-foreground">{entries.length} events</span>
      </div>
      <div className="flex-1 overflow-auto font-mono text-xs p-3 space-y-1 min-h-[200px] max-h-[320px]">
        {entries.length === 0 && (
          <div className="text-muted-foreground italic">No events yet…</div>
        )}
        {entries.map((e, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-muted-foreground shrink-0">{fmt(e.ts)}</span>
            <span className={`shrink-0 w-12 uppercase ${levelStyle[e.level]}`}>[{e.level}]</span>
            <span className="text-foreground/90">{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
