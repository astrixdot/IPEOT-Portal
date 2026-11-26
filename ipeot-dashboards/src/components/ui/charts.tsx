import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { Card, ChartSkeleton, EmptyState } from "./primitives";

export const chartAxis = {
  tick: { fill: "var(--ink-3)", fontSize: 11.5, fontFamily: "var(--font-sans)" },
  axisLine: false,
  tickLine: false,
} as const;

const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const ANIMATION = { isAnimationActive: !reducedMotion, animationDuration: 300, animationEasing: "ease-out" as const };

type TooltipPayload = { name?: string; value?: number | string; color?: string; dataKey?: string | number; payload?: Record<string, unknown> };

export function ChartTooltip({
  active,
  payload,
  label,
  unit,
  labelFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  unit?: string;
  labelFormatter?: (label: string | number | undefined, payload?: TooltipPayload[]) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pop min-w-40 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-pop">
      <p className="mb-1.5 font-semibold text-ink">{labelFormatter ? labelFormatter(label, payload) : label}</p>
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={String(item.dataKey ?? item.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-2">
              <span className="size-2.5 rounded-sm" style={{ background: item.color }} aria-hidden />
              {item.name}
            </span>
            <span className="font-semibold text-ink tabular">
              {item.value}
              {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; shape?: "square" | "line" | "dash" }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          {item.shape === "line" ? (
            <span className="h-0.5 w-3.5 rounded" style={{ background: item.color }} aria-hidden />
          ) : item.shape === "dash" ? (
            <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: item.color }} aria-hidden />
          ) : (
            <span className="size-2.5 rounded-sm" style={{ background: item.color }} aria-hidden />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartCard({
  title,
  subtitle,
  actions,
  loading,
  empty,
  height = 240,
  children,
  className,
  index,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  height?: number;
  children: ReactNode;
  className?: string;
  index?: number;
  footer?: ReactNode;
}) {
  return (
    <Card title={title} subtitle={subtitle} actions={actions} className={className} index={index}>
      {loading ? (
        <ChartSkeleton height={height} />
      ) : empty ? (
        <EmptyState icon={BarChart3} title="No data for this view">
          No projects match the current filters.
        </EmptyState>
      ) : (
        <>
          {children}
          {footer ? <div className="mt-3">{footer}</div> : null}
        </>
      )}
    </Card>
  );
}
