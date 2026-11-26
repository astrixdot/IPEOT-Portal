import { Check, MessageSquare } from "lucide-react";
import { cx } from "../../lib/format";

export type Step = { label: string; caption?: string; comments?: number };

export function Stepper({ steps, current, label, complete = false }: { steps: Step[]; current: number; label: string; complete?: boolean }) {
  return (
    <ol aria-label={label} className="flex w-full items-start overflow-x-auto pt-2 pb-1 scroll-thin">
      {steps.map((step, index) => {
        const done = complete || index < current;
        const active = !complete && index === current;
        const state = done ? "completed" : active ? "current step" : "upcoming";
        return (
          <li key={step.label} className="relative flex min-w-[62px] flex-1 flex-col sm:min-w-[88px] items-center px-1 text-center" aria-current={active ? "step" : undefined}>
            {index > 0 ? (
              <span className={cx("absolute top-[15px] right-1/2 left-[-50%] h-0.5 rounded-full transition-colors duration-500", done || active ? "bg-teal" : "bg-surface-3")} aria-hidden />
            ) : null}
            <span
              className={cx(
                "relative z-10 grid size-8 place-items-center rounded-full text-xs font-bold ring-4 ring-surface transition-all duration-300",
                done && "bg-teal text-white dark:text-navy",
                active && "bg-surface text-teal-ink ring-[3px] ring-teal shadow-[0_0_0_6px_var(--teal-soft)]",
                !done && !active && "bg-surface-3 text-ink-3",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : index + 1}
            </span>
            <span className={cx("mt-2 text-[11.5px] leading-tight font-semibold sm:text-[12.5px]", active ? "text-ink" : done ? "text-ink-2" : "text-ink-3")}>{step.label}</span>
            <span className="sr-only">, {state}</span>
            {step.caption ? <span className="mt-0.5 text-[11px] text-ink-3">{step.caption}</span> : null}
            {step.comments ? (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-soft px-1.5 py-0.5 text-[11px] font-semibold text-amber-ink">
                <MessageSquare className="size-3" aria-hidden />
                {step.comments}
                <span className="sr-only">comments</span>
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
