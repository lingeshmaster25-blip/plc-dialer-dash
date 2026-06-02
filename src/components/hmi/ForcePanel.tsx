import { useCallback, useRef, useState } from "react";
import { TAGS } from "@/lib/tag-catalog";

type Tone = "green" | "red" | "amber" | "blue" | "slate";

interface ForceTagButton {
  tag: string;       // tag name from catalog (used to look up address + write)
  label?: string;    // override display label
  tone?: Tone;       // color theme
  mode?: "hold" | "toggle"; // hold = momentary press-and-hold, toggle = click flips state
}

interface ForceSection {
  title: string;
  hint?: string;
  cols?: 2 | 3 | 4 | 5;
  buttons: ForceTagButton[];
}

interface Props {
  tags?: Record<string, boolean | number | null>;
  disabled?: boolean;
  onWrite: (tag: string, value: boolean) => void | Promise<void>;
}

const TAG_BY_NAME = new Map(TAGS.map((t) => [t.name, t]));

const TONE: Record<Tone, { idle: string; active: string; ring: string }> = {
  green: {
    idle:   "bg-emerald-900/30 hover:bg-emerald-800/40 ring-emerald-500/30 text-emerald-100",
    active: "bg-emerald-500 text-white ring-emerald-300",
    ring:   "ring-emerald-400/60",
  },
  red: {
    idle:   "bg-red-900/30 hover:bg-red-800/40 ring-red-500/30 text-red-100",
    active: "bg-red-500 text-white ring-red-300",
    ring:   "ring-red-400/60",
  },
  amber: {
    idle:   "bg-amber-900/30 hover:bg-amber-800/40 ring-amber-500/30 text-amber-100",
    active: "bg-amber-500 text-black ring-amber-300",
    ring:   "ring-amber-400/60",
  },
  blue: {
    idle:   "bg-sky-900/30 hover:bg-sky-800/40 ring-sky-500/30 text-sky-100",
    active: "bg-sky-500 text-white ring-sky-300",
    ring:   "ring-sky-400/60",
  },
  slate: {
    idle:   "bg-slate-800/40 hover:bg-slate-700/50 ring-white/10 text-foreground/90",
    active: "bg-slate-200 text-slate-900 ring-white/50",
    ring:   "ring-white/40",
  },
};

const COLS: Record<NonNullable<ForceSection["cols"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

const SECTIONS: ForceSection[] = [
  {
    title: "Force Buttons",
    hint: "M0.x · momentary",
    cols: 5,
    buttons: [
      { tag: "Start_PB",   label: "Start",       tone: "green" },
      { tag: "Stop_PB",    label: "Stop",        tone: "red"   },
      { tag: "Reset_PB",   label: "Reset",       tone: "amber" },
      { tag: "M_Run",      label: "M Run",       tone: "blue", mode: "toggle" },
      { tag: "SideSelect", label: "Side Select", tone: "slate", mode: "toggle" },
    ],
  },
  {
    title: "Door Control",
    hint: "Q0.0 / Q0.1",
    cols: 2,
    buttons: [
      { tag: "Door_Open_CMD",  label: "Door Open",  tone: "green" },
      { tag: "Door_Close_CMD", label: "Door Close", tone: "red" },
    ],
  },
  {
    title: "Axis Jog",
    hint: "Q0.2–Q1.2 · press & hold",
    cols: 4,
    buttons: [
      { tag: "Y_Fwd", label: "Y +", tone: "green" },
      { tag: "Y_Rev", label: "Y −", tone: "blue"  },
      { tag: "X_Fwd", label: "X +", tone: "green" },
      { tag: "X_Rev", label: "X −", tone: "blue"  },
      { tag: "A_Fwd", label: "A +", tone: "green" },
      { tag: "A_Rev", label: "A −", tone: "blue"  },
      { tag: "B_Fwd", label: "B +", tone: "green" },
      { tag: "B_Rev", label: "B −", tone: "blue"  },
      { tag: "Z_Up",  label: "Z ↑", tone: "amber" },
    ],
  },
];

function ForceBtn({
  spec, live, disabled, onWrite,
}: {
  spec: ForceTagButton;
  live: boolean;
  disabled?: boolean;
  onWrite: (tag: string, value: boolean) => void;
}) {
  const def = TAG_BY_NAME.get(spec.tag);
  const tone = TONE[spec.tone ?? "slate"];
  const mode = spec.mode ?? "hold";
  const [held, setHeld] = useState(false);
  const armed = useRef(false);

  const press = useCallback(() => {
    if (disabled) return;
    if (mode === "toggle") {
      onWrite(spec.tag, !live);
      return;
    }
    if (armed.current) return;
    armed.current = true;
    setHeld(true);
    onWrite(spec.tag, true);
  }, [disabled, live, mode, onWrite, spec.tag]);

  const release = useCallback(() => {
    if (mode !== "hold") return;
    if (!armed.current) return;
    armed.current = false;
    setHeld(false);
    onWrite(spec.tag, false);
  }, [mode, onWrite, spec.tag]);

  const active = mode === "hold" ? held || live : live;
  const cls = active ? tone.active : tone.idle;

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
      className={`relative select-none rounded-md ring-1 px-3 py-2.5 text-left transition-all
        active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed
        ${cls}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wide leading-tight">
          {spec.label ?? spec.tag}
        </span>
        <span
          className={`h-2 w-2 rounded-full ${
            active ? "bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]" : "bg-white/20"
          }`}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] font-mono opacity-70">
        <span>{def?.address ?? "—"}</span>
        <span>{active ? "1" : "0"}</span>
      </div>
    </button>
  );
}

export function ForcePanel({ tags, disabled, onWrite }: Props) {
  return (
    <div className="panel-bevel rounded-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Force Control
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          {disabled ? "offline" : "press & hold to force"}
        </span>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((sec) => (
          <section key={sec.title}>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-[10px] uppercase tracking-widest text-primary/80">
                {sec.title}
              </h3>
              {sec.hint && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {sec.hint}
                </span>
              )}
            </div>
            <div className={`grid ${COLS[sec.cols ?? 4]} gap-2`}>
              {sec.buttons.map((b) => (
                <ForceBtn
                  key={b.tag}
                  spec={b}
                  live={Boolean(tags?.[b.tag])}
                  disabled={disabled}
                  onWrite={onWrite}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
