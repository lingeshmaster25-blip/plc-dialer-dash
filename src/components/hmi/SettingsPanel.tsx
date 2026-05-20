import { useState } from "react";

interface Props {
  ip: string;
  rack: number;
  slot: number;
  onConnect: (ip: string, rack: number, slot: number) => void;
  connecting?: boolean;
}

export function SettingsPanel({ ip, rack, slot, onConnect, connecting }: Props) {
  const [form, setForm] = useState({ ip, rack, slot });

  return (
    <div className="panel-bevel rounded-md p-4 space-y-3">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
        PLC Configuration
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block sm:col-span-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">IP Address</span>
          <input
            value={form.ip}
            onChange={(e) => setForm({ ...form, ip: e.target.value })}
            placeholder="192.168.0.1"
            className="mt-1 w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Rack</span>
          <input
            type="number"
            value={form.rack}
            onChange={(e) => setForm({ ...form, rack: Number(e.target.value) })}
            className="mt-1 w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Slot</span>
          <input
            type="number"
            value={form.slot}
            onChange={(e) => setForm({ ...form, slot: Number(e.target.value) })}
            className="mt-1 w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-sm"
          />
        </label>
        <button
          onClick={() => onConnect(form.ip, form.rack, form.slot)}
          disabled={connecting}
          className="bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-sm rounded px-3 py-2 hover:opacity-90 disabled:opacity-50 transition"
        >
          {connecting ? "Connecting…" : "Connect"}
        </button>
      </div>
    </div>
  );
}
