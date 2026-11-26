import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertOctagon,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileUp,
  FlaskConical,
  Gauge,
  PackageOpen,
  Printer,
  QrCode as QrIcon,
  Search,
  ShoppingCart,
  Undo2,
  UserPlus,
  Wrench,
  Zap,
} from "lucide-react";
import { analysts, consumables, instruments, linked, samples as seed, SAMPLE_STAGES, tests, limsTrend, type Sample, type SampleStatus } from "../data/lims";
import { person, TODAY } from "../data/org";
import { cx, daysFromToday, formatDate, formatShort, relativeDays } from "../lib/format";
import { useFakeLoad } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { KPICard, type KPI } from "../components/ui/KPICard";
import { Banner, Button, Card, EmptyState, IdChip, PageHeader, ProgressBar, Select, Skeleton, StatusBadge, type Tone } from "../components/ui/primitives";
import { DataTable, type Column } from "../components/ui/DataTable";
import { ANIMATION, ChartCard, ChartTooltip, Legend, chartAxis } from "../components/ui/charts";
import { Field, inputClass, Modal } from "../components/ui/Overlay";
import { QrCode } from "../components/QrCode";

const statusTone: Record<SampleStatus, Tone> = { registered: "neutral", assigned: "indigo", testing: "info", review: "warning", released: "success" };
const statusLabel = Object.fromEntries(SAMPLE_STAGES.map((s) => [s.key, s.label])) as Record<SampleStatus, string>;

function scaled(series: number[], value: number) {
  const last = series[series.length - 1] || 1;
  return series.map((v) => Number(((v / last) * value).toFixed(1)));
}

function addDays(days: number) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type ModalKind = "register" | "assign" | "import" | "qr" | null;

export function LimsDashboard() {
  const toast = useToast();
  const loading = useFakeLoad(650);
  const [params] = useSearchParams();
  const [samples, setSamples] = useState<Sample[]>(seed);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<SampleStatus | "open" | "all">("open");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [indented, setIndented] = useState<Set<string>>(new Set());
  useEffect(() => {
    const q = params.get("q");
    if (q) {
      setQuery(q);
      setStatusFilter("all");
    }
  }, [params]);

  const [reg, setReg] = useState({ projectId: linked[0].id, test: 0, priority: "Routine" as Sample["priority"] });
  const [assign, setAssign] = useState({ sampleId: "", analystId: analysts[0].id });
  const [imp, setImp] = useState({ instrumentId: "ICP-01", file: "" });
  const [qrId, setQrId] = useState(() => seed.find((s) => s.status !== "released")!.id);

  const counts = useMemo(() => Object.fromEntries(SAMPLE_STAGES.map((s) => [s.key, samples.filter((x) => x.status === s.key)])) as Record<SampleStatus, Sample[]>, [samples]);
  const calibrationDue = instruments.filter((i) => daysFromToday(i.calibrationDue) <= 14);
  const lowStock = consumables.filter((c) => c.stock <= c.reorder);
  const received = samples.filter((s) => s.received >= "2026-11-01").length;
  const inProgress = counts.assigned.length + counts.testing.length;

  const kpis: KPI[] = [
    { label: "Samples received", value: received, delta: 7, goodWhen: "up", trend: scaled(limsTrend.received, received), icon: FlaskConical, tone: "teal", note: "November" },
    { label: "Tests in progress", value: inProgress, delta: 3, goodWhen: "up", trend: scaled(limsTrend.inProgress, inProgress), icon: Gauge, tone: "cyan", note: "assigned + testing" },
    { label: "Pending approval", value: counts.review.length, delta: 2, goodWhen: "down", trend: scaled(limsTrend.pending, counts.review.length), icon: ClipboardList, tone: "amber", note: "result review" },
    { label: "Calibration due", value: calibrationDue.length, delta: 1, goodWhen: "down", trend: limsTrend.calibration, icon: Wrench, tone: calibrationDue.length ? "red" : "green", note: "next 14 days" },
    { label: "Low-stock alerts", value: lowStock.length, delta: 1, goodWhen: "down", trend: limsTrend.stock, icon: PackageOpen, tone: "amber", note: "at or below reorder" },
  ];

  const queue = useMemo(() => {
    const q = query.trim().toLowerCase();
    return samples.filter(
      (s) =>
        (statusFilter === "all" || (statusFilter === "open" ? s.status !== "released" : s.status === statusFilter)) &&
        (!urgentOnly || s.priority === "Urgent") &&
        (!q || [s.id, s.test, s.material, s.wbs, s.standard].some((field) => field.toLowerCase().includes(q))),
    );
  }, [samples, query, statusFilter, urgentOnly]);

  const workload = analysts.map((a) => ({
    name: a.name.split(" ")[0],
    full: a.name,
    assigned: samples.filter((s) => s.analystId === a.id && s.status === "assigned").length,
    testing: samples.filter((s) => s.analystId === a.id && s.status === "testing").length,
    review: samples.filter((s) => s.analystId === a.id && s.status === "review").length,
  }));

  const update = (id: string, patch: Partial<Sample>) => setSamples((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const columns: Column<Sample>[] = [
    {
      key: "id",
      header: "Sample ID",
      sortValue: (s) => s.id,
      render: (s) => (
        <span className="flex items-center gap-1.5">
          <IdChip>{s.id}</IdChip>
          {s.priority === "Urgent" ? (
            <span className="inline-flex items-center text-orange" title="Urgent">
              <Zap className="size-3.5" aria-hidden />
              <span className="sr-only">Urgent</span>
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "test",
      header: "Test",
      sortValue: (s) => s.test,
      render: (s) => (
        <span className="block min-w-0">
          <span className="block font-medium text-ink">{s.test}</span>
          <span className="block text-xs text-ink-3">{s.material}</span>
          <StatusBadge tone={statusTone[s.status]} className="mt-1 sm:hidden">
            {statusLabel[s.status]}
          </StatusBadge>
        </span>
      ),
    },
    { key: "standard", header: "Method", hideBelow: "2xl", sortValue: (s) => s.standard, render: (s) => <span className="font-mono text-xs whitespace-nowrap">{s.standard}</span> },
    { key: "wbs", header: "WBS", hideBelow: "2xl", sortValue: (s) => s.wbs, render: (s) => <span className="font-mono text-xs whitespace-nowrap">{s.wbs}</span> },
    {
      key: "analyst",
      header: "Analyst",
      hideBelow: "lg",
      sortValue: (s) => s.analystId,
      render: (s) => <span className="whitespace-nowrap">{s.analystId ? analysts.find((a) => a.id === s.analystId)?.name : <span className="text-ink-3">Unassigned</span>}</span>,
    },
    {
      key: "due",
      header: "Due",
      sortValue: (s) => s.due,
      render: (s) => {
        const late = s.status !== "released" && daysFromToday(s.due) < 0;
        return (
          <span className={cx("inline-flex items-center gap-1 text-xs whitespace-nowrap tabular", late ? "font-semibold text-red-ink" : "text-ink-2")}>
            {late ? <AlertOctagon className="size-3.5" aria-hidden /> : null}
            {s.status === "released" ? formatShort(s.due) : relativeDays(s.due)}
            {late ? <span className="sr-only"> (overdue)</span> : null}
          </span>
        );
      },
    },
    { key: "status", header: "Status", hideBelow: "sm", sortValue: (s) => SAMPLE_STAGES.findIndex((x) => x.key === s.status), render: (s) => <StatusBadge tone={statusTone[s.status]}>{statusLabel[s.status]}</StatusBadge> },
  ];

  const nextId = () => `IPEOT-S-2026-${String(Math.max(...samples.map((s) => Number(s.id.slice(-4)))) + 1).padStart(4, "0")}`;

  const register = () => {
    const [material, test, standard, instrumentId] = tests[reg.test];
    const project = linked.find((p) => p.id === reg.projectId)!;
    const id = nextId();
    setSamples((list) => [{ id, projectId: project.id, wbs: project.wbs!, material, test, standard, analystId: "", instrumentId, received: TODAY.toISOString().slice(0, 10), due: addDays(reg.priority === "Urgent" ? 3 : 7), status: "registered", priority: reg.priority }, ...list]);
    setQrId(id);
    setModal("qr");
    toast.push("Sample registered", `${id} logged against ${project.wbs}. Label ready to print.`, "success");
  };

  const doAssign = () => {
    const sample = samples.find((s) => s.id === assign.sampleId);
    if (!sample) return;
    const analyst = analysts.find((a) => a.id === assign.analystId)!;
    update(sample.id, { status: "assigned", analystId: analyst.id });
    setModal(null);
    toast.push("Test assigned", `${sample.id} assigned to ${analyst.name}.`, "success");
  };

  const doImport = () => {
    const instrument = instruments.find((i) => i.id === imp.instrumentId)!;
    const file = imp.file || `${instrument.id}_export_2026-11-19.csv`;
    setModal(null);
    if (instrument.status === "Under maintenance") {
      setImportError(`${file} was rejected: ${instrument.id} (${instrument.name}) is under maintenance, so its results can’t be linked to samples. Choose another instrument or ask the lab in-charge to restore it.`);
      return;
    }
    const matched = samples.filter((s) => s.instrumentId === instrument.id && s.status === "testing").slice(0, 3);
    if (!matched.length) {
      setImportError(`${file} was parsed, but none of its rows match a sample in Testing on ${instrument.id}. Check the sample IDs in the export.`);
      return;
    }
    setImportError(null);
    matched.forEach((s) => {
      const t = tests.find((row) => row[1] === s.test);
      update(s.id, { status: "review", result: t?.[5] ?? "See attached file" });
    });
    toast.push("Instrument file imported", `${file}: ${matched.length} result${matched.length > 1 ? "s" : ""} matched and moved to Result Review.`, "success");
  };

  const qrSample = samples.find((s) => s.id === qrId) ?? samples.find((s) => s.status !== "released")!;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Laboratory Information Management"
        title="Laboratory overview"
        description={`${person("lab1")?.name} · Lab In-charge · Corrosion, Oil & Water, Materials and Instrumental sections`}
      />

      <nav aria-label="Quick actions" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Register sample", hint: "Log receipt and create label", icon: FlaskConical, primary: true, onClick: () => setModal("register") },
          {
            label: "Assign test",
            hint: `${counts.registered.length} samples unassigned`,
            icon: UserPlus,
            onClick: () => {
              setAssign({ sampleId: counts.registered[0]?.id ?? "", analystId: analysts[0].id });
              setModal("assign");
            },
          },
          { label: "Import instrument file", hint: "CSV, TXT or XLSX export", icon: FileUp, onClick: () => setModal("import") },
          { label: "Print QR label", hint: "Zebra ZD421 · receipt counter", icon: QrIcon, onClick: () => setModal("qr") },
        ].map((action, index) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={cx(
              "reveal group flex min-w-0 items-center gap-3 rounded-card border p-3 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop",
              action.primary ? "border-transparent bg-navy-2 text-white dark:bg-teal dark:text-navy" : "border-line bg-surface hover:border-line-strong",
            )}
            style={{ "--i": index } as CSSProperties}
          >
            <span className={cx("grid size-10 shrink-0 place-items-center rounded-xl", action.primary ? "bg-white/15 dark:bg-navy/15" : "bg-teal-soft text-teal-ink")}>
              <action.icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{action.label}</span>
              <span className={cx("block truncate text-xs", action.primary ? "text-white/75 dark:text-navy/75" : "text-ink-3")}>{action.hint}</span>
            </span>
          </button>
        ))}
      </nav>

      {importError ? (
        <Banner tone="critical" title="Instrument file import failed" onDismiss={() => setImportError(null)} action={<Button size="sm" onClick={() => setModal("import")}>Try again</Button>}>
          {importError}
        </Banner>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi, index) => (
          <div key={kpi.label} className={index === 4 ? "col-span-2 md:col-span-1" : undefined}>
            <KPICard kpi={kpi} index={index + 1} loading={loading} />
          </div>
        ))}
      </div>

      <Card index={6} title="Sample lifecycle" subtitle="Select a column or sample ID to filter the test queue">
        {loading ? (
          <div className="grid grid-cols-5 gap-3">
            {SAMPLE_STAGES.map((s) => (
              <Skeleton key={s.key} className="h-32" />
            ))}
          </div>
        ) : (
          <ol className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 scroll-thin md:grid md:grid-cols-5 md:overflow-visible">
            {SAMPLE_STAGES.map((stage, index) => {
              const items = counts[stage.key];
              const late = items.filter((s) => stage.key !== "released" && daysFromToday(s.due) < 0).length;
              return (
                <li key={stage.key} className="min-w-[200px] snap-start rounded-xl border border-line bg-surface-2/50 p-3 md:min-w-0">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-2 text-left"
                    onClick={() => {
                      setStatusFilter(stage.key);
                      setQuery("");
                      document.getElementById("test-queue")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    aria-label={`${stage.label}: ${items.length} samples. Filter queue`}
                  >
                    <span>
                      <span className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
                        <span className="tabular">{index + 1}.</span> {stage.label}
                      </span>
                      <span className="mt-1 block font-display text-2xl font-semibold text-ink tabular">{items.length}</span>
                    </span>
                    {late ? (
                      <StatusBadge tone="critical" className="mt-0.5">
                        {late} late
                      </StatusBadge>
                    ) : null}
                  </button>
                  <div className={cx("mt-2 h-1 rounded-full", { registered: "bg-slate", assigned: "bg-indigo", testing: "bg-cyan", review: "bg-amber", released: "bg-green" }[stage.key])} aria-hidden />
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {items.slice(0, 3).map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("all");
                            setQuery(s.id);
                            document.getElementById("test-queue")?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="rounded-md focus-visible:outline-offset-1"
                          title={`${s.test} · ${s.wbs}`}
                        >
                          <IdChip className="hover:border-cyan hover:text-ink">{s.id}</IdChip>
                        </button>
                      </li>
                    ))}
                    {items.length > 3 ? <li className="self-center text-xs text-ink-3">+{items.length - 3} more</li> : null}
                  </ul>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <Card
          id="test-queue"
          index={7}
          className="col-span-12 scroll-mt-20 xl:col-span-8"
          title="Test queue"
          subtitle={`${queue.length} of ${samples.length} samples`}
        >
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="relative flex-1">
              <span className="sr-only">Search sample ID, test, method or WBS</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sample ID, test, method, WBS…" className={cx(inputClass, "h-9 pl-9")} />
            </label>
            <div className="flex gap-2">
              <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="w-40">
                <option value="open">All open</option>
                <option value="all">All samples</option>
                {SAMPLE_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                aria-pressed={urgentOnly}
                onClick={() => setUrgentOnly(!urgentOnly)}
                className={cx(
                  "inline-flex h-9 items-center gap-1.5 self-end rounded-lg border px-3 text-sm font-medium transition-colors",
                  urgentOnly ? "border-orange/50 bg-amber-soft text-amber-ink" : "border-line-strong bg-surface text-ink-2 hover:bg-surface-2",
                )}
              >
                <Zap className="size-4" aria-hidden />
                Urgent
              </button>
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <Skeleton key={key} className="h-10" />
              ))}
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto scroll-thin">
              <DataTable
                rows={queue}
                columns={columns}
                rowKey={(s) => s.id}
                caption="Laboratory test queue"
                initialSort={{ key: "due", dir: "asc" }}
                dense
                empty={
                  <EmptyState
                    icon={Search}
                    title="No samples match"
                    action={
                      <Button
                        onClick={() => {
                          setQuery("");
                          setStatusFilter("open");
                          setUrgentOnly(false);
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  >
                    Nothing in the queue matches “{query || statusLabel[statusFilter as SampleStatus] || "these filters"}”.
                  </EmptyState>
                }
              />
            </div>
          )}
        </Card>

        <Card index={8} className="col-span-12 xl:col-span-4" title="Result approval" subtitle={`${counts.review.length} results awaiting your sign-off`} bodyClassName="!px-0">
          {counts.review.length === 0 ? (
            <EmptyState icon={CheckCheck} title="All results signed off">
              New results appear here after analyst review.
            </EmptyState>
          ) : (
            <ul className="max-h-[600px] divide-y divide-line overflow-y-auto scroll-thin">
              {counts.review.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <IdChip>{s.id}</IdChip>
                    {daysFromToday(s.due) < 0 ? (
                      <StatusBadge tone="critical">Due {formatShort(s.due)}</StatusBadge>
                    ) : (
                      <span className="text-xs text-ink-3">Due {formatShort(s.due)}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">{s.test}</p>
                  <p className="mt-0.5 flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink-3">
                      {s.standard} · {analysts.find((a) => a.id === s.analystId)?.name}
                    </span>
                  </p>
                  <p className="mt-1.5 rounded-md bg-surface-2 px-2 py-1 font-mono text-[13px] font-semibold text-ink">{s.result}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={() => {
                        update(s.id, { status: "released" });
                        toast.push("Result released", `${s.id} is now visible to the CI in the project workspace.`, "success");
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      icon={Undo2}
                      onClick={() => {
                        update(s.id, { status: "testing", result: undefined });
                        toast.push("Returned for retest", `${s.id} sent back to ${analysts.find((a) => a.id === s.analystId)?.name}.`, "info");
                      }}
                    >
                      Return
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card index={9} className="col-span-12 lg:col-span-7" title="Instruments" subtitle="Calibration status and utilisation this month">
          <ul className="divide-y divide-line">
            {instruments.map((i) => {
              const days = daysFromToday(i.calibrationDue);
              const tone: Tone = i.status === "Under maintenance" ? "neutral" : days <= 7 ? "critical" : days <= 14 ? "warning" : "success";
              return (
                <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-2.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_120px]">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <span className="font-mono text-xs text-ink-3">{i.id}</span>
                      <span className="truncate">{i.name}</span>
                    </p>
                    <p className="truncate text-xs text-ink-3">{i.model}</p>
                  </div>
                  <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
                    <ProgressBar value={i.utilisation} tone={i.utilisation >= 85 ? "warning" : "info"} showValue label={`${i.name} utilisation`} />
                  </div>
                  <div className="text-right">
                    <StatusBadge tone={tone} icon={i.status === "Under maintenance" ? Wrench : tone === "success" ? CheckCircle2 : Clock3}>
                      {i.status === "Under maintenance" ? "Maintenance" : days <= 14 ? `Cal. ${relativeDays(i.calibrationDue)}` : "Calibrated"}
                    </StatusBadge>
                    <p className="mt-0.5 text-[11px] text-ink-3">Due {formatDate(i.calibrationDue)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <ChartCard
          index={10}
          className="col-span-12 lg:col-span-5"
          title="Analyst workload"
          subtitle="Open tests per analyst"
          loading={loading}
          height={300}
          actions={
            <Legend
              items={[
                { label: "Assigned", color: "var(--indigo)" },
                { label: "Testing", color: "var(--cyan)" },
                { label: "In review", color: "var(--amber)" },
              ]}
            />
          }
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap="26%">
                <CartesianGrid horizontal={false} stroke="var(--line)" strokeDasharray="3 4" />
                <XAxis type="number" allowDecimals={false} {...chartAxis} />
                <YAxis type="category" dataKey="name" width={72} {...chartAxis} tick={{ ...chartAxis.tick, fill: "var(--ink-2)" }} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip labelFormatter={(label) => workload.find((w) => w.name === label)?.full ?? label} />} />
                <Bar dataKey="assigned" name="Assigned" stackId="w" fill="var(--indigo)" {...ANIMATION} />
                <Bar dataKey="testing" name="Testing" stackId="w" fill="var(--cyan)" {...ANIMATION} />
                <Bar dataKey="review" name="In review" stackId="w" fill="var(--amber)" radius={[0, 4, 4, 0]} {...ANIMATION} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card index={11} className="col-span-12" title="Consumables" subtitle={`${lowStock.length} items at or below reorder level`}>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
            {[...consumables]
              .sort((a, b) => a.stock / a.reorder - b.stock / b.reorder)
              .map((c) => {
                const low = c.stock <= c.reorder;
                const critical = c.stock <= c.reorder / 2;
                return (
                  <li key={c.name} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0 md:[&:nth-last-child(2)]:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                        {low ? <AlertOctagon className={cx("size-4 shrink-0", critical ? "text-red-ink" : "text-amber-ink")} aria-hidden /> : null}
                        <span className="min-w-0 truncate" title={c.name}>
                          {c.name}
                        </span>
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <ProgressBar value={(c.stock / c.max) * 100} marker={(c.reorder / c.max) * 100} tone={critical ? "critical" : low ? "warning" : "accent"} label={`${c.name}: ${c.stock} ${c.unit} in stock, reorder at ${c.reorder}`} className="flex-1" />
                        <span className={cx("w-24 shrink-0 text-right text-xs tabular", low ? "font-semibold text-ink" : "text-ink-2")}>
                          {c.stock} / {c.max} {c.unit}
                        </span>
                      </div>
                    </div>
                    {low ? (
                      <Button
                        size="sm"
                        variant={indented.has(c.name) ? "ghost" : "subtle"}
                        icon={indented.has(c.name) ? CheckCircle2 : ShoppingCart}
                        disabled={indented.has(c.name)}
                        onClick={() => {
                          setIndented((current) => new Set(current).add(c.name));
                          toast.push("Indent raised", `${c.max - c.stock} ${c.unit} of ${c.name} requested from ${c.supplier} via SAP MM.`, "success");
                        }}
                        aria-label={indented.has(c.name) ? `Indent raised for ${c.name}` : `Reorder ${c.name}`}
                      >
                        <span className="hidden sm:inline">{indented.has(c.name) ? "Indented" : "Reorder"}</span>
                      </Button>
                    ) : (
                      <span className="w-[92px] shrink-0 text-right text-xs text-ink-3 sm:w-[86px]">In stock</span>
                    )}
                  </li>
                );
              })}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-3">
            <span className="inline-block h-3 w-0.5 bg-ink/70" aria-hidden />
            Marker shows the reorder level.
          </p>
        </Card>
      </div>

      <Modal
        open={modal === "register"}
        onClose={() => setModal(null)}
        title="Register sample"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" icon={QrIcon} onClick={register}>
              Register & create label
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Project (WBS)">
            <select value={reg.projectId} onChange={(event) => setReg({ ...reg, projectId: event.target.value })} className={inputClass}>
              {linked.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.wbs} – {p.title.length > 48 ? `${p.title.slice(0, 48)}…` : p.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Test and method">
            <select value={reg.test} onChange={(event) => setReg({ ...reg, test: Number(event.target.value) })} className={inputClass}>
              {tests.map((t, index) => (
                <option key={t[1]} value={index}>
                  {t[1]} · {t[0]} ({t[2]})
                </option>
              ))}
            </select>
          </Field>
          <fieldset>
            <legend className="text-[13px] font-medium text-ink-2">Priority</legend>
            <div className="mt-1 flex gap-2">
              {(["Routine", "Urgent"] as const).map((p) => (
                <label key={p} className={cx("flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium", reg.priority === p ? "border-cyan bg-cyan-soft text-cyan-ink" : "border-line-strong text-ink-2")}>
                  <input type="radio" name="priority" value={p} checked={reg.priority === p} onChange={() => setReg({ ...reg, priority: p })} className="sr-only" />
                  {p === "Urgent" ? <Zap className="size-4" aria-hidden /> : null}
                  {p}
                  <span className="text-xs font-normal text-ink-3">({p === "Urgent" ? "3 d" : "7 d"})</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-3">
            Next ID: <span className="font-mono font-semibold text-ink-2">{nextId()}</span> · received {formatDate(TODAY.toISOString())}
          </p>
        </div>
      </Modal>

      <Modal
        open={modal === "assign"}
        onClose={() => setModal(null)}
        title="Assign test"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" icon={UserPlus} onClick={doAssign} disabled={!assign.sampleId}>
              Assign
            </Button>
          </>
        }
      >
        {counts.registered.length === 0 ? (
          <EmptyState icon={CheckCheck} title="No samples waiting">
            Every registered sample already has an analyst.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <Field label="Sample">
              <select value={assign.sampleId} onChange={(event) => setAssign({ ...assign, sampleId: event.target.value })} className={inputClass}>
                {counts.registered.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.test}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Analyst" hint="Open tests shown in brackets.">
              <select value={assign.analystId} onChange={(event) => setAssign({ ...assign, analystId: event.target.value })} className={inputClass}>
                {analysts.map((a) => {
                  const open = samples.filter((s) => s.analystId === a.id && s.status !== "released").length;
                  return (
                    <option key={a.id} value={a.id}>
                      {a.name} – {a.section} ({open})
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={modal === "import"}
        onClose={() => setModal(null)}
        title="Import instrument file"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" icon={FileUp} onClick={doImport}>
              Import
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Instrument">
            <select value={imp.instrumentId} onChange={(event) => setImp({ ...imp, instrumentId: event.target.value })} className={inputClass}>
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id} – {i.name}
                  {i.status === "Under maintenance" ? " (under maintenance)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Result file" hint="CSV, TXT or XLSX. Leave empty to use the latest export from the instrument share.">
            <input type="file" accept=".csv,.txt,.xlsx" onChange={(event) => setImp({ ...imp, file: event.target.files?.[0]?.name ?? "" })} className={cx(inputClass, "h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-medium file:text-ink")} />
          </Field>
          <p className="rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs break-all text-ink-3">\\ipeot-lims\exports\{imp.instrumentId}\{imp.file || `${imp.instrumentId}_export_2026-11-19.csv`}</p>
        </div>
      </Modal>

      <Modal
        open={modal === "qr"}
        onClose={() => setModal(null)}
        title="Print QR label"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              icon={Printer}
              onClick={() => {
                setModal(null);
                toast.push("Label sent to printer", `${qrSample.id} → Zebra ZD421, Sample receipt counter.`, "success");
              }}
            >
              Print label
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Sample">
            <select value={qrSample.id} onChange={(event) => setQrId(event.target.value)} className={inputClass}>
              {samples
                .filter((s) => s.status !== "released")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.test}
                  </option>
                ))}
            </select>
          </Field>
          <div className="mx-auto flex max-w-sm items-center gap-4 rounded-xl border-2 border-dashed border-line-strong bg-white p-4 text-[#0b1b2e]">
            <QrCode value={qrSample.id} size={112} />
            <div className="min-w-0 text-xs leading-relaxed">
              <p className="font-mono text-[13px] font-bold">{qrSample.id}</p>
              <p className="mt-1 font-semibold">{qrSample.test}</p>
              <p>{qrSample.material}</p>
              <p className="font-mono">{qrSample.wbs}</p>
              <p>Recd. {formatDate(qrSample.received)}</p>
              <p className="mt-1 font-semibold">IPEOT · ONGC Panvel</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
