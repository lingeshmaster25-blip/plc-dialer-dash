import { TAGS, type TagDef } from "@/lib/tag-catalog";

const TAG_BY_NAME = new Map(TAGS.map((t) => [t.name, t]));

type Tone = "blue" | "green" | "amber";

interface Item {
  tag: string;
  label: string;
  unit?: string;
}

interface Group {
  title: string;
  hint?: string;
  tone: Tone;
  cols?: 2 | 3 | 5;
  items: Item[];
}

const GROUPS: Group[] = [
  {
    title: "Target Positions",
    hint: "DB4 · REAL",
    tone: "blue",
    cols: 5,
    items: [
      { tag: "Y_Target", label: "Y" },
      { tag: "X_Target", label: "X" },
      { tag: "A_Target", label: "A" },
      { tag: "B_Target", label: "B" },
      { tag: "Z_Target", label: "Z" },
    ],
  },
  {
    title: "Actual Positions",
    hint: "DB4 · REAL",
    tone: "green",
    cols: 5,
    items: [
      { tag: "Y_ActualPos", label: "Y" },
      { tag: "X_ActualPos", label: "X" },
      { tag: "A_ActualPos", label: "A" },
      { tag: "B_ActualPos", label: "B" },
      { tag: "Z_ActualPos", label: "Z" },
    ],
  },
  {
    title: "Watch Values",
    hint: "MW · INT",
    tone: "amber",
    cols: 5,
    items: [
      { tag: "Step",         label: "Step"          },
      { tag: "CurrentStage", label: "Current Stage" },
      { tag: "SelectedBin",  label: "Selected Bin"  },
      { tag: "RackNo",       label: "Rack No"       },
      { tag: "RackBin",      label: "Rack Bin"      },
    ],
  },
];

const TONE: Record<Tone, { ring: string; value: string; chip: string }> = {
  blue:  { ring: "ring-sky-500/30",     value: "text-sky-200",     chip: "bg-sky-500/15 text-sky-200" },
  green: { ring: "ring-emerald-500/30", value: "text-emerald-200", chip: "bg-emerald-500/15 text-emerald-200" },
  amber: { ring: "ring-amber-500/30",   value: "text-amber-200",   chip: "bg-amber-500/15 text-amber-200" },
};

const COLS: Record<NonNullable<Group["cols"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

function formatValue(def: TagDef | undefined, raw: boolean | number | null | undefined) {
  if (raw === null || raw === undefined) return "—";
  if (def?.type === "real") return Number(raw).toFixed(2);
  return String(raw);
}

interface Props {
  tags?: Record<string, boolean | number | null>;
}

export function MonitorPanel({ tags }: Props) {
  return (
    <div className="panel-bevel rounded-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Live Monitor
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          updating · 500 ms
        </span>
      </div>
      <div className="space-y-5">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-[10px] uppercase tracking-widest text-primary/80">
                {g.title}
              </h3>
              {g.hint && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {g.hint}
                </span>
              )}
            </div>
            <div className={`grid ${COLS[g.cols ?? 5]} gap-2`}>
              {g.items.map((it) => {
                const def = TAG_BY_NAME.get(it.tag);
                const raw = tags?.[it.tag];
                const text = formatValue(def, raw);
                const has = raw !== null && raw !== undefined;
                return (
                  <div
                    key={it.tag}
                    className={`rounded-md bg-black/40 ring-1 ${TONE[g.tone].ring} px-3 py-2.5`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                        {it.label}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${TONE[g.tone].chip}`}>
                        {def?.address ?? "—"}
                      </span>
                    </div>
                    <div className={`text-2xl font-mono font-bold tabular-nums ${has ? TONE[g.tone].value : "text-muted-foreground"}`}>
                      {text}
                      {it.unit && has && (
                        <span className="text-xs font-normal opacity-60 ml-1">{it.unit}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
