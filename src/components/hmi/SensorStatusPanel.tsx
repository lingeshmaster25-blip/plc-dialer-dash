import { TAGS } from "@/lib/tag-catalog";

const TAG_BY_NAME = new Map(TAGS.map((t) => [t.name, t]));

type Tone = "green" | "blue" | "amber" | "red";

interface LampSpec {
  tag: string;
  label: string;
  tone?: Tone;
  /** when true, ON state means a fault / alarm condition */
  alarm?: boolean;
}

interface Section {
  title: string;
  hint?: string;
  cols?: 2 | 3 | 4;
  items: LampSpec[];
}

const SECTIONS: Section[] = [
  {
    title: "Safety",
    hint: "I0.3",
    cols: 2,
    items: [{ tag: "Emergency_Stop", label: "Emergency Stop", tone: "red", alarm: true }],
  },
  {
    title: "Doors",
    hint: "I0.3 / I0.4",
    cols: 2,
    items: [
      { tag: "Door_Open_LS",  label: "Door Open LS",  tone: "green" },
      { tag: "Door_Close_LS", label: "Door Close LS", tone: "green" },
    ],
  },
  {
    title: "Tray",
    hint: "I0.6 · I1.3 · I1.4 · M2.3",
    cols: 4,
    items: [
      { tag: "Tray_Out_LS",       label: "Tray Out LS",     tone: "amber" },
      { tag: "Tray_Pos_S1",       label: "Tray Pos S1",     tone: "green" },
      { tag: "Tray_Pos_S2",       label: "Tray Pos S2",     tone: "green" },
      { tag: "Tray_Misalignment", label: "Tray Misalign",   tone: "red", alarm: true },
    ],
  },
  {
    title: "Load / Bin",
    hint: "I1.1 · I1.2 · I1.5",
    cols: 3,
    items: [
      { tag: "Load_Cell_Overload", label: "Load Overload",  tone: "red", alarm: true },
      { tag: "Light_Grid_BinMax",  label: "Light Grid Max", tone: "amber" },
      { tag: "Bin_Confirm_Sensor", label: "Bin Confirm",    tone: "green" },
    ],
  },
  {
    title: "External Aisle",
    hint: "I0.5 · I0.7 · I1.6 · I1.7",
    cols: 4,
    items: [
      { tag: "Ext_Aisle_Area_S1", label: "Aisle S1", tone: "blue" },
      { tag: "Ext_Aisle_Area_S2", label: "Aisle S2", tone: "blue" },
      { tag: "Ext_Aisle_Area_S3", label: "Aisle S3", tone: "blue" },
      { tag: "Ext_Aisle_Area_S4", label: "Aisle S4", tone: "blue" },
    ],
  },
  {
    title: "Mode",
    hint: "M0.5 / M0.6",
    cols: 2,
    items: [
      { tag: "M_Run",      label: "M Run",       tone: "green" },
      { tag: "SideSelect", label: "Side Select", tone: "blue" },
    ],
  },
];

const COLS: Record<NonNullable<Section["cols"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

const LAMP: Record<Tone, { on: string; ring: string; text: string }> = {
  green: { on: "bg-emerald-400 lamp-glow-green", ring: "ring-emerald-500/40", text: "text-emerald-100" },
  blue:  { on: "bg-sky-400 lamp-glow-blue",       ring: "ring-sky-500/40",     text: "text-sky-100" },
  amber: { on: "bg-amber-400 lamp-glow-amber",    ring: "ring-amber-500/40",   text: "text-amber-100" },
  red:   { on: "bg-red-400 lamp-glow-red",        ring: "ring-red-500/40",     text: "text-red-100" },
};

interface Props {
  tags?: Record<string, boolean | number | null>;
}

function Lamp({ spec, on }: { spec: LampSpec; on: boolean }) {
  const def = TAG_BY_NAME.get(spec.tag);
  const tone = LAMP[spec.tone ?? "green"];
  const alarming = on && spec.alarm;
  return (
    <div
      className={`flex items-center gap-3 rounded-md bg-black/40 ring-1 px-3 py-2.5
        ${alarming ? "ring-red-500/60 bg-red-950/30" : "ring-white/5"}`}
    >
      <span
        className={`relative h-3.5 w-3.5 rounded-full ring-1 ${tone.ring} flex-shrink-0
          ${on ? tone.on : "bg-white/10"}`}
      >
        {alarming && (
          <span className="absolute inset-0 rounded-full animate-hmi-pulse bg-red-400" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-[12px] font-semibold uppercase tracking-wide truncate ${on ? tone.text : "text-foreground/80"}`}>
          {spec.label}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {def?.address ?? "—"}
        </div>
      </div>
      <span className={`text-[10px] font-mono tabular-nums ${on ? tone.text : "text-muted-foreground"}`}>
        {on ? "1" : "0"}
      </span>
    </div>
  );
}

export function SensorStatusPanel({ tags }: Props) {
  return (
    <div className="panel-bevel rounded-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Sensor Status
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          live · indicator
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
            <div className={`grid ${COLS[sec.cols ?? 3]} gap-2`}>
              {sec.items.map((it) => (
                <Lamp key={it.tag} spec={it} on={Boolean(tags?.[it.tag])} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
