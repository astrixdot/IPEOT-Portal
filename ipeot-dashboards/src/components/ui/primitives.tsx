import type { ButtonHTMLAttributes, CSSProperties, ReactNode, SelectHTMLAttributes } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock3,
  Info,
  Timer,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "../../data/types";
import { CATEGORY_LABEL } from "../../data/projects";
import { cx, initials } from "../../lib/format";

/* ---------- Card ---------- */

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  index = 0,
  id,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  index?: number;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cx("reveal flex min-w-0 flex-col rounded-card border border-line bg-surface shadow-card", className)}
      style={{ "--i": index } as CSSProperties}
      aria-label={typeof title === "string" ? title : undefined}
    >
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title ? <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-[13px] text-ink-3">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("min-w-0 flex-1 px-5 pb-5", !title && !actions && "pt-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-navy-2 text-white hover:bg-navy dark:bg-teal dark:text-navy dark:hover:bg-teal dark:hover:brightness-110",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-red text-white hover:brightness-110 dark:text-navy",
  subtle: "bg-cyan-soft text-cyan-ink hover:brightness-95 dark:hover:brightness-125",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md"; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-[background-color,filter,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 px-2.5 text-[13px]" : "h-9 px-3.5 text-sm",
        buttonStyles[variant],
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden /> : null}
      {children}
    </button>
  );
}

/* ---------- Select ---------- */

export function Select({ label, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className={cx("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">{label}</span>
      <select
        className="h-9 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-line-strong bg-surface bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8 pl-3 text-sm text-ink transition-colors hover:border-cyan"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237d8fa3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "h-8 min-w-12 rounded-lg px-3 text-[13px] font-semibold transition-all duration-200",
              active ? "bg-surface text-ink shadow-card ring-1 ring-line" : "text-ink-3 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Status badge ---------- */

export type Tone = "neutral" | "info" | "success" | "warning" | "critical" | "accent" | "indigo";

const toneStyles: Record<Tone, { cls: string; icon: LucideIcon }> = {
  neutral: { cls: "bg-slate-soft text-ink-2 ring-line", icon: Circle },
  info: { cls: "bg-cyan-soft text-cyan-ink ring-cyan/25", icon: CircleDot },
  success: { cls: "bg-green-soft text-green-ink ring-green/25", icon: CheckCircle2 },
  warning: { cls: "bg-amber-soft text-amber-ink ring-amber/30", icon: Clock3 },
  critical: { cls: "bg-red-soft text-red-ink ring-red/25", icon: AlertOctagon },
  accent: { cls: "bg-teal-soft text-teal-ink ring-teal/25", icon: CircleDot },
  indigo: { cls: "bg-indigo-soft text-indigo-ink ring-indigo/25", icon: CircleDot },
};

export function StatusBadge({ tone = "neutral", children, icon, className }: { tone?: Tone; children: ReactNode; icon?: LucideIcon | null; className?: string }) {
  const style = toneStyles[tone];
  const Icon = icon === null ? null : icon ?? style.icon;
  return (
    <span className={cx("inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold whitespace-nowrap ring-1 ring-inset", style.cls, className)}>
      {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
      {children}
    </span>
  );
}

/* ---------- Category badge (colour + glyph + label) ---------- */

export const categoryStyle: Record<Category, { cls: string; icon: LucideIcon; color: string }> = {
  scheduled: { cls: "bg-teal-soft text-teal-ink ring-teal/30", icon: CalendarCheck2, color: "var(--cat-scheduled)" },
  unscheduled: { cls: "bg-indigo-soft text-indigo-ink ring-indigo/30", icon: Zap, color: "var(--cat-unscheduled)" },
  short_term: { cls: "bg-amber-soft text-amber-ink ring-amber/30", icon: Timer, color: "var(--cat-short)" },
};

export function CategoryBadge({ category, compact = false }: { category: Category; compact?: boolean }) {
  const style = categoryStyle[category];
  const Icon = style.icon;
  return (
    <span className={cx("inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset", style.cls)} title={CATEGORY_LABEL[category]}>
      <Icon className="size-3.5" aria-hidden />
      {compact ? <span className="sr-only">{CATEGORY_LABEL[category]}</span> : CATEGORY_LABEL[category]}
    </span>
  );
}

/* ---------- Mono ID chip ---------- */

export function IdChip({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cx("inline-flex h-6 items-center rounded-md border border-line bg-surface-2 px-1.5 font-mono whitespace-nowrap text-[11.5px] font-medium tracking-tight text-ink-2", className)}>
      {children}
    </span>
  );
}

/* ---------- Progress bar ---------- */

const barTone: Record<string, string> = {
  accent: "bg-teal",
  info: "bg-cyan",
  warning: "bg-amber",
  critical: "bg-red",
  success: "bg-green",
  indigo: "bg-indigo",
  neutral: "bg-slate",
};

export function ProgressBar({
  value,
  tone = "accent",
  label,
  showValue = false,
  marker,
  className,
  height = "h-1.5",
}: {
  value: number;
  tone?: keyof typeof barTone;
  label: string;
  showValue?: boolean;
  marker?: number;
  className?: string;
  height?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("flex items-center gap-2", className)}>
      <div
        className={cx("relative w-full overflow-hidden rounded-full bg-surface-3", height)}
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cx("h-full rounded-full transition-[width] duration-700 ease-out", barTone[tone])} style={{ width: `${clamped}%` }} />
        {marker != null ? <div className="absolute inset-y-0 w-0.5 bg-ink/70" style={{ left: `${Math.min(100, marker)}%` }} aria-hidden /> : null}
      </div>
      {showValue ? <span className="w-9 shrink-0 text-right text-xs font-semibold text-ink-2 tabular">{Math.round(clamped)}%</span> : null}
    </div>
  );
}

/* ---------- Banner ---------- */

export function Banner({
  tone = "warning",
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  tone?: "warning" | "critical" | "info";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const styles = {
    warning: { cls: "border-amber/40 bg-amber-soft", icon: AlertTriangle, iconCls: "text-amber-ink" },
    critical: { cls: "border-red/40 bg-red-soft", icon: AlertOctagon, iconCls: "text-red-ink" },
    info: { cls: "border-cyan/40 bg-cyan-soft", icon: Info, iconCls: "text-cyan-ink" },
  }[tone];
  const Icon = styles.icon;
  return (
    <div role={tone === "critical" ? "alert" : "status"} className={cx("reveal flex items-start gap-3 rounded-xl border px-4 py-3", styles.cls, className)}>
      <Icon className={cx("mt-0.5 size-5 shrink-0", styles.iconCls)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-ink">{title}</p>
          {children ? <div className="mt-0.5 text-ink-2">{children}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className="rounded-md p-1 text-ink-3 hover:bg-surface/60 hover:text-ink" aria-label="Dismiss alert">
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
        <Icon className="size-6 text-ink-3" aria-hidden />
      </div>
      <p className="mt-4 font-display text-base font-semibold text-ink">{title}</p>
      {children ? <div className="mt-1 max-w-sm text-sm text-ink-3">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden />;
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2" style={{ height }} aria-label="Loading chart" role="status">
      {[55, 80, 40, 92, 65, 75, 48, 88].map((value, index) => (
        <div key={index} className="skeleton flex-1 rounded-md" style={{ height: `${value}%` }} />
      ))}
    </div>
  );
}

/* ---------- Avatar ---------- */

const avatarColors = ["bg-teal-soft text-teal-ink", "bg-indigo-soft text-indigo-ink", "bg-cyan-soft text-cyan-ink", "bg-amber-soft text-amber-ink", "bg-green-soft text-green-ink"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center rounded-full font-semibold ring-1 ring-inset ring-line",
        size === "sm" ? "size-7 text-[11px]" : "size-9 text-xs",
        avatarColors[hash % avatarColors.length],
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/* ---------- Page header ---------- */

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="reveal flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-teal-ink uppercase">{eyebrow}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
