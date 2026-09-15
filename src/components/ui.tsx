import type { ReactNode } from "react";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/format";

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel overflow-hidden ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          {title && (
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = "accent",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "accent" | "green" | "amber" | "red" | "violet";
}) {
  const color = {
    accent: "var(--accent)",
    green: "var(--green)",
    amber: "var(--amber)",
    red: "var(--red)",
    violet: "var(--violet)",
  }[tone];

  return (
    <div className="panel px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</div>
      <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-[var(--muted)]">{hint}</div>}
    </div>
  );
}

export function StatusDot({ status, live = false }: { status: string; live?: boolean }) {
  const color = STATUS_COLOR[status] ?? "var(--muted)";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span className="relative inline-block size-2 rounded-full" style={{ background: color, color }}>
        {live && <span className="live-dot" />}
      </span>
      <span style={{ color }}>{STATUS_LABEL[status] ?? status}</span>
    </span>
  );
}

export function Tag({ children, color = "var(--muted)" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] leading-4"
      style={{ color, borderColor: `color-mix(in oklab, ${color} 35%, transparent)` }}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-[var(--muted)]">{children}</div>;
}
