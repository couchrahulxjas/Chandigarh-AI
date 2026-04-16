import type { PropsWithChildren } from "react";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={`glass-panel p-5 ${className ?? ""}`}>{children}</div>;
}

export function Label({ children }: PropsWithChildren) {
  return <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">{children}</div>;
}

export function Button({
  children,
  onClick,
  variant = "default",
  disabled,
  className
}: PropsWithChildren<{ onClick?: () => void; variant?: "default" | "ghost" | "danger" | "success"; disabled?: boolean, className?: string }>) {
  const variants = {
    default: "border-white/10 bg-white/5 hover:bg-white/10 text-white/90",
    ghost: "border-transparent bg-transparent hover:bg-white/5 text-white/60",
    danger: "border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300",
    success: "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300"
  };
  
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        variants[variant],
        className
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Toggle({
  value,
  onChange,
  children
}: PropsWithChildren<{ value: boolean; onChange: (v: boolean) => void }>) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={[
        "group flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all active:scale-[0.98]",
        value ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/5"
      ].join(" ")}
    >
      <span className="font-medium">{children}</span>
      <div className={["relative h-5 w-9 rounded-full transition-colors", value ? "bg-emerald-500/40" : "bg-white/10"].join(" ")}>
        <div className={["absolute top-1 h-3 w-3 rounded-full bg-white transition-all shadow-sm", value ? "left-5" : "left-1"].join(" ")} />
      </div>
    </button>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/50">{label}</span>
        <span className="font-mono text-[10px] tabular-nums text-emerald-400">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/5 accent-emerald-500 hover:accent-emerald-400"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

