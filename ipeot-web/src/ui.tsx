import type { ReactNode } from "react";

export const btn =
  "inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50";
export const field =
  "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink";

export function PageHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {detail ? <p className="mt-1 max-w-3xl text-sm text-mute">{detail}</p> : null}
    </header>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{children}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-8 text-center text-sm text-mute">{children}</p>;
}

export function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const statusNames: Record<string, string> = {
  plan_scheduled: "Scheduled",
  plan_unscheduled: "Unscheduled",
  hod_endorsed: "HOD endorsed",
  pcc_consolidation: "PCC consolidation",
  hoi_review: "HOI review",
  tac_review: "TAC",
  director_approved: "Director approved",
  published: "Published",
  removed: "Removed / not approved",
  short_term_closed: "Closed (short-term)",
  in_year_approved: "Unscheduled (in-year)",
  department_review: "Department review",
  incharge_review: "In-charge review",
  routed: "Routed to department",
  short_term: "Short-term",
};

export function statusLabel(value: string) {
  return statusNames[value] || value.replaceAll("_", " ");
}
