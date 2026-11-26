import type { CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { useCountUp } from "../../lib/hooks";
import { cx } from "../../lib/format";
import { Skeleton } from "./primitives";

export function Sparkline({ data, color, className = "w-24" }: { data: number[]; color: string; className?: string }) {
  const width = 96;
  const height = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => [(index / (data.length - 1)) * width, height - 3 - ((value - min) / range) * (height - 6)]);
  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = `spark-${color.replace(/[^a-z]/gi, "")}`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cx("h-8 shrink-0 overflow-visible", className)} aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} />
    </svg>
  );
}

export type KPI = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delta: number;
  deltaSuffix?: string;
  goodWhen: "up" | "down";
  trend: number[];
  icon: LucideIcon;
  tone: "teal" | "cyan" | "amber" | "red" | "indigo" | "green";
  note: string;
};

const toneColor: Record<KPI["tone"], { color: string; chip: string }> = {
  teal: { color: "var(--teal)", chip: "bg-teal-soft text-teal-ink" },
  cyan: { color: "var(--cyan)", chip: "bg-cyan-soft text-cyan-ink" },
  amber: { color: "var(--amber)", chip: "bg-amber-soft text-amber-ink" },
  red: { color: "var(--red)", chip: "bg-red-soft text-red-ink" },
  indigo: { color: "var(--indigo)", chip: "bg-indigo-soft text-indigo-ink" },
  green: { color: "var(--green)", chip: "bg-green-soft text-green-ink" },
};

export function KPICard({ kpi, index = 0, loading, onClick }: { kpi: KPI; index?: number; loading?: boolean; onClick?: () => void }) {
  const animated = useCountUp(loading ? 0 : kpi.value);
  const tone = toneColor[kpi.tone];
  const Icon = kpi.icon;
  const flat = kpi.delta === 0;
  const good = flat ? null : (kpi.delta > 0) === (kpi.goodWhen === "up");
  const DeltaIcon = flat ? Minus : kpi.delta > 0 ? ArrowUpRight : ArrowDownRight;
  const deltaText = `${kpi.delta > 0 ? "+" : ""}${kpi.delta}${kpi.deltaSuffix ?? ""}`;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cx(
        "reveal group relative flex min-w-0 flex-col rounded-card border border-line bg-surface p-4 text-left shadow-card transition-all duration-200",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop",
      )}
      style={{ "--i": index } as CSSProperties}
      aria-label={onClick ? `${kpi.label}: ${kpi.value}${kpi.suffix ?? ""}. ${kpi.note}. Open details` : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] leading-tight font-medium text-ink-3">{kpi.label}</span>
        <span className={cx("grid size-7 shrink-0 place-items-center rounded-lg", tone.chip)}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-3 h-4 w-full" />
        </>
      ) : (
        <>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="font-display text-[26px] leading-none font-semibold tracking-tight whitespace-nowrap text-ink tabular sm:text-[28px]">
              {animated.toFixed(kpi.decimals ?? 0)}
              {kpi.suffix ? <span className="ml-0.5 text-base font-medium text-ink-3">{kpi.suffix}</span> : null}
            </p>
            <Sparkline data={kpi.trend} color={tone.color} className="w-14 sm:w-24" />
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span
              className={cx(
                "inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold whitespace-nowrap tabular",
                good == null ? "bg-slate-soft text-ink-2" : good ? "bg-green-soft text-green-ink" : "bg-red-soft text-red-ink",
              )}
            >
              <DeltaIcon className="size-3.5" aria-hidden />
              {deltaText}
              <span className="sr-only">{good == null ? "no change" : good ? "improving" : "worsening"}</span>
            </span>
            <span className="truncate text-ink-3">{kpi.note}</span>
          </div>
        </>
      )}
    </Tag>
  );
}
