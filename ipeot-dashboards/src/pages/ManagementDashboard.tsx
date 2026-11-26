import { useMemo, useState, type ChangeEvent, type CSSProperties } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertOctagon,
  BellRing,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileSpreadsheet,
  FilterX,
  Gauge,
  Layers,
  Printer,
  RefreshCw,
  SearchX,
  Stamp,
  TriangleAlert,
} from "lucide-react";
import type { Project, Role } from "../data/types";
import { departments, FINANCIAL_YEARS, workCentres, department, person, TODAY } from "../data/org";
import { CATEGORY_LABEL, projects, stageMeta } from "../data/projects";
import { ROLES, roleMeta, scopeProjects, useRole } from "../lib/role";
import { useFakeLoad } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { cx, downloadCsv } from "../lib/format";
import {
  ALL,
  applyFilters,
  awpProgress,
  byCategory,
  byDepartment,
  byWorkCentre,
  defaultFilters,
  escalations,
  pipeline,
  STATUS_GROUPS,
  summary,
  trend,
  turnaround,
  workload,
  WORKLOAD_COLUMNS,
  type Filters,
} from "../lib/analytics";
import { KPICard, type KPI } from "../components/ui/KPICard";
import { Banner, Button, Card, CategoryBadge, categoryStyle, EmptyState, PageHeader, ProgressBar, Segmented, Select, Skeleton, StatusBadge, IdChip } from "../components/ui/primitives";
import { ANIMATION, ChartCard, ChartTooltip, Legend, chartAxis } from "../components/ui/charts";
import { Drawer } from "../components/ui/Overlay";
import { ProjectList } from "../components/ProjectRow";

type DrillDown = { title: string; subtitle: string; items: Project[] } | null;

function delta(series: number[]) {
  return Math.round(series[series.length - 1] - series[series.length - 2] + (series[series.length - 2] - series[series.length - 3]));
}

export function ManagementDashboard() {
  const { role, setRole } = useRole();
  const meta = roleMeta(role);
  const toast = useToast();
  const loading = useFakeLoad(700, role);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [drill, setDrill] = useState<DrillDown>(null);
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const [syncError, setSyncError] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const scoped = useMemo(() => scopeProjects(role, projects), [role]);
  const lockedDept = role === "HOD" || role === "IC";
  const effectiveFilters = lockedDept ? { ...filters, department: ALL } : filters;
  const list = useMemo(() => applyFilters(scoped, effectiveFilters), [scoped, effectiveFilters.department, effectiveFilters.workCentre, effectiveFilters.category, effectiveFilters.fy]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtersActive = Object.entries(effectiveFilters).some(([, value]) => value !== ALL);

  const s = useMemo(() => summary(list), [list]);
  const stages = useMemo(() => pipeline(list), [list]);
  const tat = useMemo(() => turnaround(list), [list]);
  const categories = useMemo(() => byCategory(list), [list]);
  const depts = useMemo(() => byDepartment(list), [list]);
  const centres = useMemo(() => byWorkCentre(list), [list]);
  const load = useMemo(() => workload(list), [list]);
  const awp = useMemo(() => awpProgress(list), [list]);
  const escalated = useMemo(() => escalations(list), [list]);
  const finalLevelLate = escalated.filter((item) => item.project.stage === "final_auth");

  const open = (title: string, subtitle: string, items: Project[]) => setDrill({ title, subtitle, items });

  const kpis: (KPI & { items: Project[] })[] = useMemo(() => {
    const seed = role.length;
    const series = {
      active: trend(s.active.length, seed + 1, 0.22),
      pending: trend(s.pending.length, seed + 2, 0.4),
      overdue: trend(s.overdue.length, seed + 3, 0.5),
      tat: trend(Math.round(s.avgTurnaround), seed + 4, 0.16),
      published: [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, Math.max(0, s.published.length - 1), s.published.length].map((value) => Math.min(value, s.published.length)),
      awp: [4, 9, 14, 19, 24, 29, 34, 39, 44, 48, Math.round(s.awpCompletion) - 3, Math.round(s.awpCompletion)].map((value) => Math.min(value, s.awpCompletion)),
    };
    return [
      { label: "Active projects", value: s.active.length, delta: delta(series.active), goodWhen: "up", trend: series.active, icon: Layers, tone: "teal", note: "vs last month", items: s.active },
      { label: "Pending approvals", value: s.pending.length, delta: delta(series.pending), goodWhen: "down", trend: series.pending, icon: Stamp, tone: "indigo", note: "I/C, HOD, HOI, TAC", items: s.pending },
      { label: "Overdue items", value: s.overdue.length, delta: delta(series.overdue), goodWhen: "down", trend: series.overdue, icon: TriangleAlert, tone: s.overdue.length ? "red" : "green", note: "beyond stage target", items: s.overdue },
      { label: "Avg approval cycle", value: Math.round(s.avgTurnaround), suffix: " d", delta: delta(series.tat), deltaSuffix: " d", goodWhen: "down", trend: series.tat, icon: Clock3, tone: "amber", note: "target 50 d", items: s.cycled },
      { label: "Reports published", value: s.published.length, delta: 1, goodWhen: "up", trend: series.published, icon: FileCheck2, tone: "green", note: `FY ${"2026-27"}`, items: s.published },
      { label: "AWP completion", value: Number(s.awpCompletion.toFixed(1)), suffix: "%", decimals: 0, delta: 6, deltaSuffix: " pt", goodWhen: "up", trend: series.awp, icon: Gauge, tone: "cyan", note: "approved AWP, avg. progress", items: list.filter((p) => p.category === "scheduled" && p.fy === "2026-27") },
    ];
  }, [s, list, role]);

  const setFilter = (key: keyof Filters) => (event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  const exportExcel = () => {
    downloadCsv(`ipeot-mis-${role.toLowerCase()}-${TODAY.toISOString().slice(0, 10)}.csv`, [
      ["Proposal No.", "WBS", "Title", "Department", "Work centre", "Category", "Stage", "Pending with", "Days at stage", "Overdue (d)", "CI", "FY", "Progress %"],
      ...list.map((p) => [
        p.proposalNo,
        p.wbs ?? "",
        p.title,
        department(p.departmentId).code,
        p.workCentre,
        CATEGORY_LABEL[p.category],
        stageMeta(p.stage).label,
        p.pendingWith,
        p.daysInStage,
        escalated.find((item) => item.project.id === p.id)?.overdue ?? 0,
        person(p.ciId)?.name ?? "",
        p.fy,
        p.progress,
      ]),
    ]);
    toast.push("Excel export ready", `${list.length} projects exported as CSV.`, "success");
  };

  const retrySync = () => {
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      setSyncError(false);
      toast.push("SAP PS sync complete", "WBS statuses refreshed for 31 projects.", "success");
    }, 1100);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Management & MIS"
        title={role === "HOI" ? "Institute overview" : role === "PCC" ? "Coordination overview" : role === "HOD" ? "Department overview" : "I/C overview"}
        description={
          <>
            Viewing as <span className="font-semibold text-ink-2">{meta.user.name}</span> ({meta.label}) · {meta.scope} · as of 19 Nov 2026, 10:00 IST
          </>
        }
        actions={
          <>
            <Button icon={FileSpreadsheet} onClick={exportExcel} className="no-print">
              Export Excel
            </Button>
            <Button icon={Printer} onClick={() => window.print()} className="no-print">
              Export PDF
            </Button>
          </>
        }
      />

      <Card index={1} bodyClassName="!py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="shrink-0">
            <p className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">Role scope</p>
            <Segmented<Role> label="Role scope" value={role} onChange={setRole} options={ROLES.map((item) => ({ value: item.key, label: item.label }))} />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
            <Select label="Department" value={lockedDept ? "3" : filters.department} onChange={setFilter("department")} disabled={lockedDept} title={lockedDept ? "Department is fixed by your role" : undefined}>
              <option value={ALL}>All departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} – {dept.short}
                </option>
              ))}
            </Select>
            <Select label="Work centre" value={filters.workCentre} onChange={setFilter("workCentre")}>
              <option value={ALL}>All work centres</option>
              {workCentres.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </Select>
            <Select label="Category" value={filters.category} onChange={setFilter("category")}>
              <option value={ALL}>All categories</option>
              <option value="scheduled">Scheduled</option>
              <option value="unscheduled">Unscheduled</option>
              <option value="short_term">Short-term</option>
            </Select>
            <Select label="Financial year" value={filters.fy} onChange={setFilter("fy")}>
              <option value={ALL}>All years</option>
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy}
                </option>
              ))}
            </Select>
          </div>
          {filtersActive ? (
            <Button variant="ghost" icon={FilterX} onClick={() => setFilters(defaultFilters)} className="self-start xl:self-end">
              Reset
            </Button>
          ) : null}
        </div>
      </Card>

      {syncError ? (
        <Banner
          tone="critical"
          title="SAP PS sync failed at 07:12 IST"
          onDismiss={() => setSyncError(false)}
          action={
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={retrySync} disabled={syncing} className={syncing ? "[&>svg]:animate-spin" : undefined}>
              {syncing ? "Retrying…" : "Retry sync"}
            </Button>
          }
        >
          WBS and cost figures are from the 18 Nov run. The SAP gateway returned a timeout (RFC_ERROR_COMMUNICATION).
        </Banner>
      ) : null}

      {!loading && finalLevelLate.length ? (
        <Banner
          tone="warning"
          title={`${finalLevelLate.length} proposal${finalLevelLate.length > 1 ? "s are" : " is"} waiting beyond target at HOI / TAC / Director`}
          action={
            <Button size="sm" variant="secondary" onClick={() => open("Overdue at final authorisation", "HOI / TAC / Director (Production)", finalLevelLate.map((item) => item.project))}>
              Review
            </Button>
          }
        >
          Longest wait: {finalLevelLate[0].project.title} ({finalLevelLate[0].overdue} days over the {finalLevelLate[0].target}-day target).
        </Banner>
      ) : null}

      {!loading && list.length === 0 ? (
        <Card index={2}>
          <EmptyState
            icon={SearchX}
            title="No projects match these filters"
            action={
              <Button variant="primary" icon={FilterX} onClick={() => setFilters(defaultFilters)}>
                Reset filters
              </Button>
            }
          >
            Try a different work centre or category, or widen the financial year.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
            {kpis.map((kpi, index) => (
              <KPICard key={kpi.label} kpi={kpi} index={index + 2} loading={loading} onClick={() => open(kpi.label, `${kpi.items.length} projects · ${meta.scope}`, kpi.items)} />
            ))}
          </div>

          <Card index={8} title="Project pipeline" subtitle="Select a stage to see its projects" actions={<Legend items={[{ label: "Overdue at stage", color: "var(--red)" }]} />}>
            {loading ? (
              <div className="grid grid-cols-4 gap-3 xl:grid-cols-8">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="h-24" />
                ))}
              </div>
            ) : (
              <ol className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 scroll-thin xl:grid xl:grid-cols-8 xl:overflow-visible">
                {stages.map((stage, index) => (
                  <li key={stage.key} className="relative min-w-[132px] snap-start xl:min-w-0">
                    <button
                      type="button"
                      onClick={() => open(stage.label, `${stage.count} projects at this stage`, stage.items)}
                      className={cx(
                        "group flex h-full w-full flex-col rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop",
                        stage.overdue ? "border-red/30 bg-red-soft/40" : "border-line bg-surface-2/60 hover:border-line-strong",
                      )}
                      aria-label={`${stage.label}: ${stage.count} projects${stage.overdue ? `, ${stage.overdue} overdue` : ""}`}
                    >
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
                        <span className="grid size-4 place-items-center rounded-full bg-surface-3 text-[10px] text-ink-2 tabular">{index + 1}</span>
                        <span className="truncate">{stage.short}</span>
                      </span>
                      <span className="mt-2 font-display text-[26px] leading-none font-semibold text-ink tabular">{stage.count}</span>
                      <span className="mt-2 min-h-5 text-xs">
                        {stage.overdue ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-ink">
                            <AlertOctagon className="size-3.5" aria-hidden />
                            {stage.overdue} overdue
                          </span>
                        ) : stage.target ? (
                          <span className="text-ink-3">Target {stage.target} d</span>
                        ) : (
                          <span className="text-ink-3">{stage.key === "closed" ? "Archived to KB" : "Milestone-tracked"}</span>
                        )}
                      </span>
                    </button>
                    {index < stages.length - 1 ? (
                      <ChevronRight className="absolute top-1/2 -right-2 z-10 hidden size-4 -translate-y-1/2 rounded-full bg-surface text-ink-3 xl:block" aria-hidden />
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <div className="grid grid-cols-12 gap-4">
            <Card
              index={9}
              className="col-span-12 lg:col-span-5"
              title="Overdue & escalations"
              subtitle={`${escalated.length} items beyond target`}
              actions={
                escalated.length > 5 ? (
                  <Button size="sm" variant="ghost" onClick={() => open("Overdue & escalations", `${escalated.length} items beyond target`, escalated.map((item) => item.project))}>
                    View all
                  </Button>
                ) : null
              }
              bodyClassName="!px-0"
            >
              {loading ? (
                <div className="space-y-3 px-5">
                  {[0, 1, 2, 3].map((key) => (
                    <Skeleton key={key} className="h-16" />
                  ))}
                </div>
              ) : escalated.length === 0 ? (
                <EmptyState icon={CheckCheck} title="Nothing overdue">
                  Every item in this view is within its stage target.
                </EmptyState>
              ) : (
                <>
                  <div className="mb-2 grid grid-cols-3 gap-2 px-5">
                    {[
                      { label: "> 21 d", count: escalated.filter((item) => item.overdue > 21).length, cls: "text-red-ink" },
                      { label: "8–21 d", count: escalated.filter((item) => item.overdue > 7 && item.overdue <= 21).length, cls: "text-orange" },
                      { label: "1–7 d", count: escalated.filter((item) => item.overdue <= 7).length, cls: "text-amber-ink" },
                    ].map((bucket) => (
                      <div key={bucket.label} className="rounded-lg bg-surface-2 px-3 py-2">
                        <p className={cx("font-display text-lg font-semibold tabular", bucket.cls)}>{bucket.count}</p>
                        <p className="text-[11px] text-ink-3">over by {bucket.label}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="divide-y divide-line">
                    {escalated.slice(0, 5).map(({ project, overdue, target }) => {
                      const sent = reminded.has(project.id);
                      return (
                        <li key={project.id} className="flex items-start gap-3 px-5 py-3">
                          <span className={cx("mt-1 grid size-7 shrink-0 place-items-center rounded-lg", overdue > 14 ? "bg-red-soft text-red-ink" : "bg-amber-soft text-amber-ink")}>
                            {overdue > 14 ? <AlertOctagon className="size-4" aria-hidden /> : <Clock3 className="size-4" aria-hidden />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink" title={project.title}>
                              {project.title}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-3">
                              {stageMeta(project.stage).label} · with <span className="text-ink-2">{project.pendingWith}</span>
                            </p>
                            <p className={cx("mt-1 text-xs font-semibold", overdue > 14 ? "text-red-ink" : "text-amber-ink")}>
                              {project.stage === "execution" ? `Milestone slipped ${overdue} d` : `${overdue} d over the ${target}-day target`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={sent ? "ghost" : "subtle"}
                            icon={sent ? CheckCircle2 : BellRing}
                            disabled={sent}
                            onClick={() => {
                              setReminded((current) => new Set(current).add(project.id));
                              toast.push("Reminder sent", `${project.pendingWith} notified by e-mail and portal alert.`, "success");
                            }}
                            aria-label={sent ? `Reminder sent for ${project.title}` : `Send reminder for ${project.title}`}
                          >
                            <span className="hidden sm:inline">{sent ? "Sent" : "Send reminder"}</span>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Card>

            <Card
              index={10}
              className="col-span-12 lg:col-span-7"
              title="Turnaround by stage"
              subtitle="Average days at each stage against its target"
              actions={<Legend items={[{ label: "Target", color: "var(--ink-2)", shape: "line" }]} />}
            >
              {loading ? (
                <div className="space-y-4">
                  {[0, 1, 2, 3, 4, 5].map((key) => (
                    <Skeleton key={key} className="h-9" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {tat.map((row) => {
                    const ratio = row.actual / row.target;
                    const tone = ratio <= 1 ? "accent" : ratio <= 1.2 ? "warning" : "critical";
                    const StatusIcon = ratio <= 1 ? CheckCircle2 : ratio <= 1.2 ? Clock3 : AlertOctagon;
                    return (
                      <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[180px_minmax(0,1fr)_120px]">
                        <p className="truncate text-[13px] font-medium text-ink-2">{row.label}</p>
                        <ProgressBar className="order-3 col-span-2 sm:order-none sm:col-span-1" value={(row.actual / (row.target * 2)) * 100} marker={50} tone={tone} height="h-2.5" label={`${row.label}: ${row.actual} days against ${row.target}-day target`} />
                        <p className={cx("flex items-center justify-end gap-1 text-xs font-semibold tabular", tone === "accent" ? "text-teal-ink" : tone === "warning" ? "text-amber-ink" : "text-red-ink")}>
                          <StatusIcon className="size-3.5" aria-hidden />
                          {row.actual} d <span className="font-normal text-ink-3">/ {row.target} d</span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!loading && tat.length ? (
                <dl className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(() => {
                    const over = tat.filter((row) => row.actual > row.target);
                    const slowest = [...tat].sort((a, b) => b.actual / b.target - a.actual / a.target)[0];
                    return [
                      { label: "Proposal to WBS release", value: `${Math.round(s.avgTurnaround)} d`, note: "target 50 d", cls: s.avgTurnaround > 50 ? "text-red-ink" : "text-ink" },
                      { label: "Stages over target", value: `${over.length} of ${tat.length}`, note: over.map((row) => row.label.split(" ")[0]).join(", ") || "none", cls: over.length ? "text-amber-ink" : "text-teal-ink" },
                      { label: "Slowest stage", value: slowest.label, note: `${Math.round((slowest.actual / slowest.target - 1) * 100)}% over target`, cls: "text-ink" },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0 rounded-lg bg-surface-2 px-3 py-2.5">
                        <dt className="text-[11px] text-ink-3">{item.label}</dt>
                        <dd className={cx("mt-0.5 truncate font-display text-base font-semibold", item.cls)}>{item.value}</dd>
                        <dd className="truncate text-[11px] text-ink-3">{item.note}</dd>
                      </div>
                    ));
                  })()}
                </dl>
              ) : null}
              <p className="mt-4 text-xs text-ink-3">Bars turn amber up to 20% over target and red beyond that. Short-term proposals use a 5-day final-authorisation target and are excluded from that row.</p>
            </Card>

            <ChartCard index={11} className="col-span-12 md:col-span-5 xl:col-span-4" title="By category" subtitle="Select a segment to drill down" loading={loading} height={220}>
              <div className="relative h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={64} outerRadius={94} paddingAngle={2} stroke="var(--surface)" strokeWidth={2} {...ANIMATION}>
                      {categories.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={categoryStyle[entry.category].color}
                          className="cursor-pointer outline-none"
                          onClick={() => open(`${CATEGORY_LABEL[entry.category]} projects`, `${entry.count} projects`, list.filter((p) => p.category === entry.category))}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-display text-3xl font-semibold text-ink tabular">{list.length}</p>
                    <p className="text-xs text-ink-3">projects</p>
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {categories.map((entry) => (
                  <li key={entry.category}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2"
                      onClick={() => open(`${CATEGORY_LABEL[entry.category]} projects`, `${entry.count} projects`, list.filter((p) => p.category === entry.category))}
                    >
                      <CategoryBadge category={entry.category} />
                      <span className="font-semibold text-ink tabular">
                        {entry.count} <span className="font-normal text-ink-3">· {list.length ? Math.round((entry.count / list.length) * 100) : 0}%</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ChartCard>

            <ChartCard
              index={12}
              className="col-span-12 md:col-span-7 xl:col-span-8"
              title="By department and status"
              subtitle="Select a bar to see the department’s projects"
              loading={loading}
              height={280}
              actions={<Legend items={STATUS_GROUPS.map((group) => ({ label: group.label, color: group.color }))} />}
            >
              <div className="h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={depts} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4" />
                    <XAxis dataKey="code" interval={0} {...chartAxis} tick={{ ...chartAxis.tick, fontSize: 11 }} />
                    <YAxis allowDecimals={false} {...chartAxis} />
                    <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip labelFormatter={(label) => departments.find((d) => d.code === label)?.name ?? label} />} />
                    {STATUS_GROUPS.map((group, index) => (
                      <Bar
                        key={group.key}
                        dataKey={group.key}
                        name={group.label}
                        stackId="status"
                        fill={group.color}
                        radius={index === STATUS_GROUPS.length - 1 ? [5, 5, 0, 0] : 0}
                        className="cursor-pointer"
                        onClick={(data) => {
                          const id = Number((data as unknown as { payload: { id: number } }).payload.id);
                          open(department(id).name, `${list.filter((p) => p.departmentId === id).length} projects`, list.filter((p) => p.departmentId === id));
                        }}
                        {...ANIMATION}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              index={13}
              className="col-span-12 xl:col-span-5"
              title="By work centre"
              subtitle="Stacked by category"
              loading={loading}
              height={320}
              actions={<Legend items={(["scheduled", "unscheduled", "short_term"] as const).map((c) => ({ label: CATEGORY_LABEL[c], color: categoryStyle[c].color }))} />}
            >
              <div style={{ height: Math.max(160, centres.length * 30 + 20) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={centres} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                    <CartesianGrid horizontal={false} stroke="var(--line)" strokeDasharray="3 4" />
                    <XAxis type="number" allowDecimals={false} {...chartAxis} />
                    <YAxis type="category" dataKey="name" width={128} {...chartAxis} tick={{ ...chartAxis.tick, fill: "var(--ink-2)" }} />
                    <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip />} />
                    {(["scheduled", "unscheduled", "short_term"] as const).map((c, index) => (
                      <Bar key={c} dataKey={c} name={CATEGORY_LABEL[c]} stackId="cat" fill={categoryStyle[c].color} radius={index === 2 ? [0, 4, 4, 0] : 0} {...ANIMATION} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <Card index={14} className="col-span-12 xl:col-span-7" title="Investigator workload" subtitle="Open projects per Chief Investigator, by phase">
              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5].map((key) => (
                    <Skeleton key={key} className="h-8" />
                  ))}
                </div>
              ) : load.length === 0 ? (
                <EmptyState icon={Layers} title="No open assignments">
                  All projects in this view are closed.
                </EmptyState>
              ) : (
                <div className="-mx-5 overflow-x-auto px-5 scroll-thin">
                  <table className="w-full min-w-[440px] border-separate border-spacing-y-1 text-sm">
                    <caption className="sr-only">Number of open projects per investigator and phase</caption>
                    <thead>
                      <tr className="text-left text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
                        <th scope="col" className="pb-1 font-semibold">Investigator</th>
                        {WORKLOAD_COLUMNS.map((column) => (
                          <th key={column.key} scope="col" className="w-24 pb-1 text-center font-semibold">
                            {column.label}
                          </th>
                        ))}
                        <th scope="col" className="w-40 pb-1 pl-3 font-semibold">Load vs capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {load.map((row) => {
                        const ratio = row.total / row.capacity;
                        return (
                          <tr key={row.person.id}>
                            <th scope="row" className="pr-3 text-left font-normal">
                              <span className="flex items-center gap-2">
                                <IdChip className="hidden w-12 justify-center sm:inline-flex">{department(row.person.departmentId).code}</IdChip>
                                <span className="truncate font-medium text-ink">{row.person.name}</span>
                                {row.overdue ? (
                                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-red-ink" title={`${row.overdue} overdue`}>
                                    <AlertOctagon className="size-3" aria-hidden />
                                    {row.overdue}
                                    <span className="sr-only"> overdue</span>
                                  </span>
                                ) : null}
                              </span>
                            </th>
                            {row.cells.map((value, index) => (
                              <td key={index} className="px-0.5">
                                <span
                                  className={cx("grid h-8 place-items-center rounded-md text-[13px] font-semibold tabular transition-colors", value ? "text-ink" : "text-ink-3")}
                                  style={{ background: value ? `color-mix(in oklab, var(--teal) ${Math.min(18 + value * 22, 75)}%, transparent)` : "var(--surface-2)" } as CSSProperties}
                                >
                                  {value || "–"}
                                </span>
                              </td>
                            ))}
                            <td className="pl-3">
                              <div className="flex items-center gap-2">
                                <ProgressBar value={ratio * 100} tone={ratio > 1 ? "critical" : ratio >= 0.8 ? "warning" : "accent"} label={`${row.person.name}: ${row.total} of ${row.capacity}`} className="flex-1" />
                                <span className={cx("w-9 text-right text-xs font-semibold tabular", ratio > 1 ? "text-red-ink" : "text-ink-2")}>
                                  {row.total}/{row.capacity}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card index={15} className="col-span-12" title="AWP 2026-27 progress" subtitle="Scheduled projects in the Annual Work Plan · cycle runs 1 Apr 2026 – 31 Mar 2027">
              {loading ? (
                <Skeleton className="h-36" />
              ) : awp.submitted === 0 ? (
                <EmptyState icon={Layers} title="No AWP projects in this view">
                  Scheduled projects for FY 2026-27 appear here once they are in scope.
                </EmptyState>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                  <div>
                    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: "Submitted", value: awp.submitted, note: `${awp.pendingApproval} awaiting approval`, cls: "text-ink" },
                        { label: "Approved", value: awp.approved, note: `${Math.round((awp.approved / awp.submitted) * 100)}% of submitted`, cls: "text-indigo-ink" },
                        { label: "In progress", value: awp.inProgress, note: "WBS released", cls: "text-teal-ink" },
                        { label: "Completed", value: awp.completed, note: "report published", cls: "text-green-ink" },
                      ].map((item, index) => (
                        <li key={item.label} className="relative rounded-xl border border-line bg-surface-2/60 p-3">
                          <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
                            <span className="mr-1 text-ink-3 tabular">{index + 1}.</span>
                            {item.label}
                          </p>
                          <p className={cx("mt-1 font-display text-2xl font-semibold tabular", item.cls)}>{item.value}</p>
                          <p className="mt-0.5 text-xs text-ink-3">{item.note}</p>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-5 space-y-3">
                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium text-ink-2">Average progress of approved AWP projects</span>
                          <span className="font-semibold text-ink tabular">{Math.round(s.awpCompletion)}%</span>
                        </div>
                        <ProgressBar value={s.awpCompletion} tone="info" height="h-2.5" marker={64} label="AWP average progress" />
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-ink-3">
                        <span className="inline-block h-3 w-0.5 bg-ink/70" aria-hidden />
                        Marker shows time elapsed in the cycle: 64% (day 233 of 365).
                        {s.awpCompletion < 64 ? <StatusBadge tone="warning">Behind plan</StatusBadge> : <StatusBadge tone="success">On plan</StatusBadge>}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Approved vs submitted, by department</p>
                    <ul className="space-y-2.5">
                      {awp.byDepartment.map((row) => (
                        <li key={row.code} className="grid grid-cols-[52px_minmax(0,1fr)_44px] items-center gap-3">
                          <IdChip className="justify-center">{row.code}</IdChip>
                          <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-3" role="img" aria-label={`${row.name}: ${row.approved} of ${row.total} approved, ${row.done} completed`}>
                            <div className="absolute inset-y-0 left-0 rounded-full bg-indigo/70 transition-[width] duration-700" style={{ width: `${(row.approved / row.total) * 100}%` }} />
                            <div className="absolute inset-y-0 left-0 rounded-full bg-green transition-[width] duration-700" style={{ width: `${(row.done / row.total) * 100}%` }} />
                          </div>
                          <span className="text-right text-xs font-semibold text-ink-2 tabular">
                            {row.approved}/{row.total}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <Legend
                        items={[
                          { label: "Approved", color: "color-mix(in oklab, var(--indigo) 70%, transparent)" },
                          { label: "Completed", color: "var(--green)" },
                          { label: "Submitted", color: "var(--surface-3)" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <Drawer open={drill != null} onClose={() => setDrill(null)} title={drill?.title ?? ""} subtitle={drill?.subtitle}>
        {drill && drill.items.length ? (
          <ProjectList items={drill.items} />
        ) : (
          <EmptyState icon={CheckCheck} title="Nothing here">
            No projects in this view.
          </EmptyState>
        )}
      </Drawer>
    </div>
  );
}
