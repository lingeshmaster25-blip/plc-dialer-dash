import { useCallback, useRef, useState } from "react";
import { TAGS } from "@/lib/tag-catalog";

const TAG_BY_NAME = new Map(TAGS.map((t) => [t.name, t]));

interface Props {
  tags?: Record<string, boolean | number | null>;
  disabled?: boolean;
  onWrite: (tag: string, value: boolean) => void | Promise<void>;
  onDisconnect?: () => void;
}

/* ---------- Big momentary push-buttons (Motor Control slot) ---------- */

type BigTone = "green" | "red" | "blue";

const BIG_STYLES: Record<BigTone, string> = {
  green:
    "bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white border-emerald-900 shadow-[0_6px_0_oklch(0.3_0.12_145),0_8px_16px_oklch(0_0_0/0.5)]",
  red:
    "bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white border-red-900 shadow-[0_6px_0_oklch(0.3_0.18_27),0_8px_16px_oklch(0_0_0/0.5)]",
  blue:
    "bg-gradient-to-b from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 text-white border-sky-900 shadow-[0_6px_0_oklch(0.3_0.12_230),0_8px_16px_oklch(0_0_0/0.5)]",
};

function BigForceButton({
  tag, label, tone, round, live, disabled, onWrite,
}: {
  tag: string;
  label: string;
  tone: BigTone;
  round?: boolean;
  live: boolean;
  disabled?: boolean;
  onWrite: (tag: string, value: boolean) => void;
}) {
  const def = TAG_BY_NAME.get(tag);
  const armed = useRef(false);
  const [held, setHeld] = useState(false);

  const press = useCallback(() => {
    if (disabled || armed.current) return;
    armed.current = true;
    setHeld(true);
    onWrite(tag, true);
  }, [disabled, onWrite, tag]);

  const release = useCallback(() => {
    if (!armed.current) return;
    armed.current = false;
    setHeld(false);
    onWrite(tag, false);
  }, [onWrite, tag]);

  const active = held || live;

  return (
    <button
      type="button"
      disabled={disabled || !def}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
      onTouchStart={(e) => { e.preventDefault(); press(); }}
      onTouchEnd={(e) => { e.preventDefault(); release(); }}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative select-none border-2 px-6 py-6 font-bold uppercase tracking-widest
        transition-all duration-100 active:translate-y-1 active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${BIG_STYLES[tone]}
        ${round ? "rounded-full aspect-square min-w-[160px]" : "rounded-2xl"}
        ${active ? "ring-4 ring-white/40 ring-offset-2 ring-offset-background" : ""}`}
    >
      {active && (
        <span className="absolute inset-0 rounded-2xl bg-white/10 animate-hmi-pulse pointer-events-none" />
      )}
      <div className="relative flex flex-col items-center justify-center gap-1">
        <span className={round ? "text-2xl" : "text-xl"}>{label}</span>
        <span className="text-[10px] font-mono opacity-80">{def?.address ?? "—"}</span>
      </div>
    </button>
  );
}

/* ---------- Panel ---------- */

export function ForcePanel({ tags, disabled, onWrite, onDisconnect }: Props) {
  const start = Boolean(tags?.Start_PB);
  const stop = Boolean(tags?.Stop_PB);
  const reset = Boolean(tags?.Reset_PB);

  return (
    <div className="panel-bevel rounded-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Force Control
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-muted-foreground">
            M0.0 / M0.1 / M0.2 · M6.0
          </div>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              disabled={disabled}
              className="bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded px-3 py-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ring-1 ring-red-900"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Big 4 — Start / Home / Stop / Reset */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-items-center">
        <BigForceButton
          tag="Start_PB"
          label="Start"
          tone="green"
          live={start}
          disabled={disabled}
          onWrite={onWrite}
        />
        <BigForceButton
          tag="Home_Button"
          label="Home"
          tone="blue"
          live={Boolean(tags?.Home_Button)}
          disabled={disabled}
          onWrite={onWrite}
        />
        <BigForceButton
          tag="Stop_PB"
          label="Stop"
          tone="red"
          round
          live={stop}
          disabled={disabled}
          onWrite={onWrite}
        />
        <BigForceButton
          tag="Reset_PB"
          label="Reset"
          tone="blue"
          live={reset}
          disabled={disabled}
          onWrite={onWrite}
        />
      </div>
    </div>
  );
}
