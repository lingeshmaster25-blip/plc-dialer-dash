import { TAGS } from "@/lib/tag-catalog";

const TAG_BY_NAME = new Map(TAGS.map((t) => [t.name, t]));

type Tone = "green" | "blue" | "amber" | "red";

interface IndicatorSpec {
  tag: string;
  label: string;
  tone?: Tone;
}

interface Section {
  title: string;
  hint?: string;
  cols?: 2 | 3 | 4;
  items: IndicatorSpec[];
}

const SECTIONS: Section[] = [
  {
    title: "Door Commands",
    hint: "Q0.0 / Q0.1 / Q1.3",
    cols: 3,
    items: [
      { tag: "Door_Open_CMD",  label: "Door Open",  tone: "green" },
      { tag: "Door_Close_CMD", label: "Door Close", tone: "red" },
      { tag: "Z_Down",         label: "Z Down",     tone: "amber" },
    ],
  },
  {
    title: "Axis Drive",
    hint: "Q0.2 – Q1.2",
    cols: 2,
    items: [
      { tag: "Y_Fwd", label: "Y Forward", tone: "green" },
      { tag: "Y_Rev", label: "Y Reverse", tone: "blue" },
      { tag: "X_Fwd", label: "X Forward", tone: "green" },
      { tag: "X_Rev", label: "X Reverse", tone: "blue" },
      { tag: "A_Fwd", label: "A Forward", tone: "green" },
      { tag: "A_Rev", label: "A Reverse", tone: "blue" },
      { tag: "B_Fwd", label: "B Forward", tone: "green" },
      { tag: "B_Rev", label: "B Reverse", tone: "blue" },
      { tag: "Z_Up",  label: "Z Up",      tone: "amber" },
    ],
  },
  {
    title: "System",
    hint: "Q1.5 / Q1.6",
    cols: 2,
    items: [
      { tag: "Cycle_Complete", label: "Cycle Complete", tone: "green" },
      { tag: "Fault_Alarm",    label: "Fault Alarm",    tone: "red" },
    ],
  },
];

const TONE: Record<Tone, { on: string; off: string }> = {
  green: {
    on:  "bg-emerald-500 text-white ring-emerald-300",
    off: "bg-emerald-950/40 ring-emerald-500/20 text-emerald-200/70",
  },
  blue: {
    on:  "bg-sky-500 text-white ring-sky-300",
    off: "bg-sky-950/40 ring-sky-500/20 text-sky-200/70",
  },
  amber: {
    on:  "bg-amber-500 text-black ring-amber-300",
    off: "bg-amber-950/40 ring-amber-500/20 text-amber-200/70",
  },
  red: {
    on:  "bg-red-500 text-white ring-red-300",
    off: "bg-red-950/40 ring-red-500/20 text-red-200/70",
  },
};

const COLS: Record<NonNullable<Section["cols"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

interface Props {
  tags?: Record<string, boolean | number | null>;
}

function Indicator({ spec, on }: { spec: IndicatorSpec; on: boolean }) {
  const def = TAG_BY_NAME.get(spec.tag);
  const t = TONE[spec.tone ?? "green"];
  return (
    <div
      className={`rounded-md ring-1 px-3 py-2.5 transition-colors ${
        on ? t.on : t.off
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wide leading-tight">
          {spec.label}
        </span>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            on
              ? "bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.7)]"
              : "bg-white/20"
          }`}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] font-mono opacity-80">
        <span>{def?.address ?? "—"}</span>
        <span>{on ? "1" : "0"}</span>
      </div>
    </div>
  );
}

export function OutputStatusPanel({ tags }: Props) {
  return (
    <div className="panel-bevel rounded-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Output Status
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          live · read-only
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
              {sec.items.map((it) => (
                <Indicator
                  key={it.tag}
                  spec={it}
                  on={Boolean(tags?.[it.tag])}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
