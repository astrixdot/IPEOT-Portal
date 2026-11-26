import type { Category, Project, StageKey } from "../data/types";
import { CURRENT_FY, departments, people, workCentres } from "../data/org";
import { STAGES, isOverdue, isPendingApproval, overdueDays, stageTarget } from "../data/projects";

export type Filters = { department: string; workCentre: string; category: string; fy: string };
export const ALL = "all";
export const defaultFilters: Filters = { department: ALL, workCentre: ALL, category: ALL, fy: ALL };

export function applyFilters(list: Project[], filters: Filters) {
  return list.filter(
    (p) =>
      (filters.department === ALL || String(p.departmentId) === filters.department) &&
      (filters.workCentre === ALL || p.workCentre === filters.workCentre) &&
      (filters.category === ALL || p.category === filters.category) &&
      (filters.fy === ALL || p.fy === filters.fy),
  );
}

/* Deterministic 12-month series ending at `end`. */
export function trend(end: number, seed: number, swing = 0.18) {
  const out: number[] = [];
  let value = end * (1 - swing * 0.9);
  for (let i = 0; i < 11; i += 1) {
    const wobble = Math.sin(seed * 1.7 + i * 1.3) * swing * 0.35 * Math.max(end, 1);
    value += (end - value) * 0.18 + wobble * 0.3;
    out.push(Math.max(0, Number(value.toFixed(1))));
  }
  out.push(end);
  return out;
}

const approvalStages: StageKey[] = ["proposal", "ic_review", "hod", "final_auth"];

export function approvalCycleDays(project: Project) {
  const keys: StageKey[] = [...approvalStages, "initiated"];
  return keys.reduce((sum, key) => sum + (project.history[key] ?? 0), 0);
}

export function summary(list: Project[]) {
  const active = list.filter((p) => p.stage !== "closed");
  const pending = list.filter(isPendingApproval);
  const overdue = list.filter(isOverdue);
  const cycled = list.filter((p) => p.history.initiated != null);
  const avgTurnaround = cycled.length ? cycled.reduce((sum, p) => sum + approvalCycleDays(p), 0) / cycled.length : 0;
  const published = list.filter((p) => p.stage === "closed" && p.fy === CURRENT_FY);
  const awp = list.filter((p) => p.category === "scheduled" && p.fy === CURRENT_FY && STAGES.findIndex((s) => s.key === p.stage) >= 4);
  const awpCompletion = awp.length ? awp.reduce((sum, p) => sum + p.progress, 0) / awp.length : 0;
  return { active, pending, overdue, avgTurnaround, published, awpCompletion, cycled };
}

export function pipeline(list: Project[]) {
  return STAGES.map((stage) => {
    const items = list.filter((p) => p.stage === stage.key);
    return { ...stage, count: items.length, overdue: items.filter(isOverdue).length, items };
  });
}

export function turnaround(list: Project[]) {
  const rows: { key: StageKey; label: string; target: number; actual: number; samples: number }[] = [];
  const stages: StageKey[] = ["proposal", "ic_review", "hod", "final_auth", "initiated", "report_approval"];
  for (const key of stages) {
    const withHistory = list.filter((p) => p.history[key] != null && !(key === "final_auth" && p.category === "short_term"));
    const meta = STAGES.find((s) => s.key === key)!;
    if (!withHistory.length) continue;
    const actual = withHistory.reduce((sum, p) => sum + (p.history[key] ?? 0), 0) / withHistory.length;
    rows.push({ key, label: meta.label, target: meta.target ?? 0, actual: Number(actual.toFixed(1)), samples: withHistory.length });
  }
  return rows;
}

export function byCategory(list: Project[]) {
  const categories: Category[] = ["scheduled", "unscheduled", "short_term"];
  return categories.map((category) => ({ category, count: list.filter((p) => p.category === category).length }));
}

export const STATUS_GROUPS = [
  { key: "approval", label: "In approval", stages: approvalStages, color: "var(--indigo)" },
  { key: "execution", label: "In execution", stages: ["initiated", "execution"] as StageKey[], color: "var(--teal)" },
  { key: "reporting", label: "Report approval", stages: ["report_approval"] as StageKey[], color: "var(--cyan)" },
  { key: "closed", label: "Closed", stages: ["closed"] as StageKey[], color: "var(--slate)" },
];

export function byDepartment(list: Project[]) {
  return departments
    .map((dept) => {
      const rows = list.filter((p) => p.departmentId === dept.id);
      const entry: Record<string, string | number> = { id: dept.id, code: dept.code, name: dept.name, total: rows.length };
      for (const group of STATUS_GROUPS) entry[group.key] = rows.filter((p) => group.stages.includes(p.stage)).length;
      return entry;
    })
    .filter((entry) => Number(entry.total) > 0);
}

export function byWorkCentre(list: Project[]) {
  return workCentres
    .map((name) => {
      const rows = list.filter((p) => p.workCentre === name);
      return {
        name: name.replace(" Asset", "").replace(" Plant", " Plant"),
        full: name,
        scheduled: rows.filter((p) => p.category === "scheduled").length,
        unscheduled: rows.filter((p) => p.category === "unscheduled").length,
        short_term: rows.filter((p) => p.category === "short_term").length,
        total: rows.length,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}

export const WORKLOAD_COLUMNS = [
  { key: "approval", label: "In approval", stages: approvalStages },
  { key: "execution", label: "Execution", stages: ["initiated", "execution"] as StageKey[] },
  { key: "report", label: "Reporting", stages: ["report_approval"] as StageKey[] },
];

export function workload(list: Project[]) {
  const ids = [...new Set(list.map((p) => p.ciId))];
  return people
    .filter((person) => ids.includes(person.id))
    .map((person) => {
      const mine = list.filter((p) => p.ciId === person.id && p.stage !== "closed");
      const cells = WORKLOAD_COLUMNS.map((column) => mine.filter((p) => column.stages.includes(p.stage)).length);
      return { person, cells, total: mine.length, capacity: person.capacity ?? 4, overdue: mine.filter(isOverdue).length };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => a.person.departmentId - b.person.departmentId || b.total - a.total);
}

export function awpProgress(list: Project[]) {
  const cycle = list.filter((p) => p.category === "scheduled" && p.fy === CURRENT_FY);
  const index = (p: Project) => STAGES.findIndex((s) => s.key === p.stage);
  return {
    submitted: cycle.length,
    approved: cycle.filter((p) => index(p) >= 4).length,
    inProgress: cycle.filter((p) => index(p) >= 4 && index(p) <= 6).length,
    completed: cycle.filter((p) => p.stage === "closed").length,
    pendingApproval: cycle.filter((p) => index(p) < 4).length,
    byDepartment: departments
      .map((dept) => {
        const rows = cycle.filter((p) => p.departmentId === dept.id);
        return { code: dept.code, name: dept.short, total: rows.length, approved: rows.filter((p) => index(p) >= 4).length, done: rows.filter((p) => p.stage === "closed").length };
      })
      .filter((row) => row.total > 0),
  };
}

export function escalations(list: Project[]) {
  return list
    .filter(isOverdue)
    .map((p) => ({ project: p, overdue: overdueDays(p), target: p.stage === "execution" ? null : stageTarget(p) }))
    .sort((a, b) => b.overdue - a.overdue);
}
