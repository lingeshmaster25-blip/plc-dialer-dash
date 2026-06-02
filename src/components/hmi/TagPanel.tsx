import { TAGS, TAG_GROUPS, type TagDef } from "@/lib/tag-catalog";

interface Props {
  tags?: Record<string, boolean | number | null>;
}

function formatValue(tag: TagDef, v: boolean | number | null | undefined) {
  if (v === undefined || v === null) return "—";
  if (tag.type === "bool") return v ? "1" : "0";
  if (tag.type === "real") return Number(v).toFixed(2);
  return String(v);
}

export function TagPanel({ tags }: Props) {
  return (
    <div className="panel-bevel rounded-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          PLC Tags
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          {TAGS.length} tags · live
        </span>
      </div>
      <div className="space-y-5">
        {TAG_GROUPS.map((group) => {
          const items = TAGS.filter((t) => t.group === group);
          return (
            <section key={group}>
              <h3 className="text-[10px] uppercase tracking-widest text-primary/80 mb-2">
                {group}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-xs">
                {items.map((tag) => {
                  const raw = tags?.[tag.name];
                  const isBoolOn = tag.type === "bool" && raw === true;
                  return (
                    <div
                      key={tag.name + tag.address}
                      className="flex items-center justify-between bg-black/40 rounded px-3 py-2 ring-1 ring-white/5"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="truncate text-foreground/90">{tag.name}</div>
                        <div className="text-[10px] text-muted-foreground">{tag.address}</div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${
                          isBoolOn
                            ? "bg-[var(--hmi-green)]/20 text-[var(--hmi-green)]"
                            : raw === undefined || raw === null
                            ? "bg-white/5 text-muted-foreground"
                            : "bg-white/10 text-foreground"
                        }`}
                      >
                        {formatValue(tag, raw as boolean | number | null | undefined)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
