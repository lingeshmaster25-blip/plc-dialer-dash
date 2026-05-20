import { ButtonHTMLAttributes } from "react";

type Variant = "forward" | "reverse" | "estop";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: Variant;
  active?: boolean;
  label: string;
  sublabel?: string;
}

export function ControlButton({ variant, active, label, sublabel, className = "", ...rest }: Props) {
  const styles: Record<Variant, string> = {
    forward:
      "bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white border-emerald-900 shadow-[0_6px_0_oklch(0.3_0.12_145),0_8px_16px_oklch(0_0_0/0.5)]",
    reverse:
      "bg-gradient-to-b from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 text-white border-sky-900 shadow-[0_6px_0_oklch(0.3_0.12_230),0_8px_16px_oklch(0_0_0/0.5)]",
    estop:
      "bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white border-red-900 shadow-[0_6px_0_oklch(0.3_0.18_27),0_8px_16px_oklch(0_0_0/0.5)]",
  };

  const isEstop = variant === "estop";

  return (
    <button
      {...rest}
      className={`relative select-none rounded-2xl border-2 px-6 py-6 font-bold uppercase tracking-widest
        transition-all duration-100 active:translate-y-1 active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${styles[variant]}
        ${isEstop ? "rounded-full aspect-square min-w-[160px]" : ""}
        ${active ? "ring-4 ring-white/40 ring-offset-2 ring-offset-background" : ""}
        ${className}`}
    >
      {active && (
        <span className="absolute inset-0 rounded-2xl bg-white/10 animate-hmi-pulse pointer-events-none" />
      )}
      <div className="relative flex flex-col items-center justify-center gap-1">
        <span className={isEstop ? "text-2xl" : "text-xl"}>{label}</span>
        {sublabel && <span className="text-[10px] font-mono opacity-80">{sublabel}</span>}
      </div>
    </button>
  );
}
