import { useMemo, useState } from "react";

const STAGES = [
  { tag: "DB_Input_BIN1", label: "BIN 1", addr: "DB3.DBW10" },
  { tag: "DB_Input_BIN2", label: "BIN 2", addr: "DB3.DBW12" },
  { tag: "DB_Input_BIN3", label: "BIN 3", addr: "DB3.DBW14" },
  { tag: "DB_Input_BIN4", label: "BIN 4", addr: "DB3.DBW16" },
  { tag: "DB_Input_BIN5", label: "BIN 5", addr: "DB3.DBW18" },
];

const MAX_BIN = 85;

interface Props {
  tags?: Record<string, boolean | number | null>;
  disabled?: boolean;
  onWrite: (tag: string, value: number) => void | Promise<void>;
}

export function StageBinsPanel({ tags, disabled, onWrite }: Props) {
  const [selectedStage, setSelectedStage] = useState(0); // 0..4

  const values = STAGES.map((s) => {
    const v = tags?.[s.tag];
    return typeof v === "number" ? v : 0;
  });

  // Numbers already used in OTHER stages (selected stage's current value is allowed)
  const usedSet = useMemo(() => {
    const set = new Set<number>();
    values.forEach((v, i) => {
      if (i !== selectedStage && v > 0 && v <= MAX_BIN) set.add(v);
    });
    return set;
  }, [values, selectedStage]);

  const current = values[selectedStage];
  const stageTag = STAGES[selectedStage].tag;

  const pick = (n: number) => {
    if (disabled || usedSet.has(n) || n === current) return;
    onWrite(stageTag, n);
  };

  const clear = () => {
    if (disabled || current === 0) return;
    onWrite(stageTag, 0);
  };

  return (
    <div className="panel-bevel rounded-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Stage Bin Selection
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          DB3.DBW0 – DBW8 · 1 to {MAX_BIN}
        </span>
      </div>

      {/* 5 stage slots */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {STAGES.map((s, i) => {
          const v = values[i];
          const isSel = i === selectedStage;
          return (
            <button
              key={s.tag}
              type="button"
              onClick={() => setSelectedStage(i)}
              className={`rounded-md ring-1 p-3 text-center transition-all
                ${isSel
                  ? "bg-primary/15 ring-primary text-foreground shadow-[0_0_0_2px_oklch(0.72_0.16_145/0.25)]"
                  : "bg-black/40 ring-white/10 hover:ring-white/30 text-foreground/80"}`}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-70">
                {s.label}
              </div>
              <div
                className={`mt-1 text-2xl font-bold tabular-nums leading-tight ${
                  v > 0 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {v > 0 ? v : "—"}
              </div>
              <div className="text-[10px] font-mono opacity-60">{s.addr}</div>
            </button>
          );
        })}
      </div>

      {/* Number picker for selected stage */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-[10px] uppercase tracking-widest text-primary/80">
            Assign bin to {STAGES[selectedStage].label}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground">
              {usedSet.size} / {STAGES.length - 1} used
            </span>
            <button
              type="button"
              onClick={clear}
              disabled={disabled || current === 0}
              className="text-[10px] font-bold uppercase tracking-widest rounded px-2 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed ring-1 ring-white/10"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-[repeat(15,minmax(0,1fr))] gap-1">
          {Array.from({ length: MAX_BIN }, (_, i) => i + 1).map((n) => {
            const used = usedSet.has(n);
            const isCurrent = n === current;
            const cls = isCurrent
              ? "bg-primary text-primary-foreground ring-2 ring-white/60 font-bold"
              : used
                ? "bg-red-950/40 text-red-300/40 ring-1 ring-red-500/20 cursor-not-allowed line-through"
                : "bg-black/40 ring-1 ring-white/10 text-foreground/80 hover:bg-primary/20 hover:ring-primary/60";
            return (
              <button
                key={n}
                type="button"
                disabled={disabled || used || isCurrent}
                onClick={() => pick(n)}
                title={
                  used
                    ? "Already used by another stage"
                    : isCurrent
                      ? "Current value"
                      : `Set ${STAGES[selectedStage].label} = ${n}`
                }
                className={`aspect-square rounded text-[11px] font-mono tabular-nums transition disabled:cursor-not-allowed ${cls}`}
              >
                {n}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-[10px] font-mono text-muted-foreground">
          Used numbers are locked across stages — pick a free number to assign,
          or Clear to free the slot.
        </p>
      </div>
    </div>
  );
}
