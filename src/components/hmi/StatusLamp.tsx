type Color = "green" | "red" | "amber" | "blue";

const colorMap: Record<Color, { base: string; glow: string; ring: string }> = {
  green: { base: "bg-[var(--hmi-green)]", glow: "lamp-glow-green", ring: "ring-[var(--hmi-green)]/30" },
  red:   { base: "bg-[var(--hmi-red)]",   glow: "lamp-glow-red",   ring: "ring-[var(--hmi-red)]/30" },
  amber: { base: "bg-[var(--hmi-amber)]", glow: "lamp-glow-amber", ring: "ring-[var(--hmi-amber)]/30" },
  blue:  { base: "bg-[var(--hmi-blue)]",  glow: "lamp-glow-blue",  ring: "ring-[var(--hmi-blue)]/30" },
};

interface StatusLampProps {
  label: string;
  tag?: string;
  active: boolean;
  color?: Color;
  pulse?: boolean;
}

export function StatusLamp({ label, tag, active, color = "green", pulse = false }: StatusLampProps) {
  const c = colorMap[color];
  return (
    <div className="panel-bevel rounded-md p-4 flex items-center gap-4">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/10">
        <div
          className={`h-7 w-7 rounded-full transition-all duration-200 ${
            active ? `${c.base} ${c.glow} ${pulse ? "animate-hmi-pulse" : ""}` : "bg-neutral-800"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold uppercase tracking-wider text-foreground/90 truncate">
          {label}
        </div>
        {tag && (
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest">{tag}</div>
        )}
      </div>
      <div
        className={`text-[10px] font-mono px-2 py-1 rounded ${
          active
            ? "bg-[var(--hmi-green)]/15 text-[var(--hmi-green)] ring-1 ring-[var(--hmi-green)]/40"
            : "bg-white/5 text-muted-foreground ring-1 ring-white/10"
        }`}
      >
        {active ? "ON" : "OFF"}
      </div>
    </div>
  );
}
