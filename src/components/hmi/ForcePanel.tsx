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

/* ---------- Small aux toggle (M_Run, SideSelect) ---------- */

function AuxToggle({
  tag, label, live, disabled, onWrite,
}: {
  tag: string;
  label: string;
  live: boolean;
  disabled?: boolean;
  onWrite: (tag: string, value: boolean) => void;
}) {
  const def = TAG_BY_NAME.get(tag);
  return (
    <button
      type="button"
      disabled={disabled || !def}
      onClick={() => onWrite(tag, !live)}
      className={`relative select-none rounded-md ring-1 px-3 py-2.5 text-left transition-all
        active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed
        ${live
          ? "bg-sky-500 text-white ring-sky-300"
          : "bg-sky-900/30 hover:bg-sky-800/40 ring-sky-500/30 text-sky-100"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wide leading-tight">
          {label}
        </span>
        <span
          className={`h-2 w-2 rounded-full ${
            live ? "bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]" : "bg-white/20"
          }`}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] font-mono opacity-70">
        <span>{def?.address ?? "—"}</span>
        <span>{live ? "1" : "0"}</span>
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
            M0.0 / M0.1 / M0.2
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

      {/* Big 3 — replaces the old Motor Control */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center justify-items-center">
        <BigForceButton
          tag="Start_PB"
          label="Start"
          tone="green"
          live={start}
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

      {/* Aux latched toggles */}
      <div className="mt-6 pt-5 border-t border-white/10">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-[10px] uppercase tracking-widest text-primary/80">
            Auxiliary
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">
            M0.x · toggle
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AuxToggle
            tag="M_Run"
            label="M Run"
            live={Boolean(tags?.M_Run)}
            disabled={disabled}
            onWrite={onWrite}
          />
          <AuxToggle
            tag="SideSelect"
            label="Side Select"
            live={Boolean(tags?.SideSelect)}
            disabled={disabled}
            onWrite={onWrite}
          />
        </div>
      </div>
    </div>
  );
}
