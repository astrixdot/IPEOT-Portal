import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { FileSpreadsheet, Search } from "lucide-react";
import type { Project } from "../data/types";
import { department, person } from "../data/org";
import { CATEGORY_LABEL, projects, stageMeta, STAGES } from "../data/projects";
import { roleMeta, scopeProjects, useRole } from "../lib/role";
import { cx, downloadCsv } from "../lib/format";
import { Button, Card, CategoryBadge, IdChip, PageHeader, ProgressBar, Select, StatusBadge } from "../components/ui/primitives";
import { DataTable, type Column } from "../components/ui/DataTable";
import { Drawer, inputClass } from "../components/ui/Overlay";
import { ProjectList, stageStatus } from "../components/ProjectRow";

export function ProjectsPage() {
  const { role } = useRole();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [stage, setStage] = useState("all");
  const [open, setOpen] = useState<Project | null>(null);
  useEffect(() => setQuery(params.get("q") ?? ""), [params]);
  const scoped = scopeProjects(role, projects);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((p) => (stage === "all" || p.stage === stage) && (!q || [p.title, p.wbs ?? "", p.proposalNo, p.workCentre].some((f) => f.toLowerCase().includes(q))));
  }, [scoped, query, stage]);

  const columns: Column<Project>[] = [
    { key: "id", header: "WBS / Proposal", hideBelow: "sm", sortValue: (p) => p.wbs ?? p.proposalNo, render: (p) => <IdChip>{p.wbs ?? p.proposalNo}</IdChip> },
    {
      key: "title",
      header: "Project",
      sortValue: (p) => p.title,
      render: (p) => (
        <span className="block min-w-0">
          <IdChip className="mb-1 sm:hidden">{p.wbs ?? p.proposalNo}</IdChip>
          <span className="line-clamp-2 font-medium text-ink">{p.title}</span>
          <span className="block text-xs text-ink-3">
            {department(p.departmentId).code} · {p.workCentre}
          </span>
        </span>
      ),
    },
    { key: "cat", header: "Category", hideBelow: "md", sortValue: (p) => p.category, render: (p) => <CategoryBadge category={p.category} compact /> },
    { key: "stage", header: "Stage", hideBelow: "md", sortValue: (p) => STAGES.findIndex((s) => s.key === p.stage), render: (p) => <span className="whitespace-nowrap">{stageMeta(p.stage).short}</span> },
    { key: "ci", header: "CI", hideBelow: "xl", sortValue: (p) => person(p.ciId)?.name ?? "", render: (p) => <span className="whitespace-nowrap">{person(p.ciId)?.name}</span> },
    { key: "progress", header: "Progress", hideBelow: "lg", sortValue: (p) => p.progress, render: (p) => <ProgressBar value={p.progress} showValue className="w-28" label={`${p.title} progress`} /> },
    {
      key: "status",
      header: "Status",
      sortValue: (p) => -(p.slipDays || p.daysInStage),
      render: (p) => {
        const s = stageStatus(p);
        return (
          <StatusBadge tone={s.tone} icon={s.icon}>
            {s.text}
          </StatusBadge>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Projects"
        title="Project register"
        description={`${scoped.length} projects · ${roleMeta(role).scope}`}
        actions={
          <Button
            icon={FileSpreadsheet}
            onClick={() =>
              downloadCsv("ipeot-project-register.csv", [
                ["Proposal No.", "WBS", "Title", "Department", "Category", "Stage", "CI", "Progress %"],
                ...rows.map((p) => [p.proposalNo, p.wbs ?? "", p.title, department(p.departmentId).code, CATEGORY_LABEL[p.category], stageMeta(p.stage).label, person(p.ciId)?.name ?? "", p.progress]),
              ])
            }
          >
            Export Excel
          </Button>
        }
      />
      <Card index={1} subtitle={`${rows.length} shown`} title="All projects">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="relative flex-1">
            <span className="sr-only">Search title, WBS, proposal number or work centre</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, WBS, proposal no., work centre…" className={cx(inputClass, "h-9 pl-9")} />
          </label>
          <Select label="Stage" value={stage} onChange={(event) => setStage(event.target.value)} className="sm:w-48">
            <option value="all">All stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <DataTable rows={rows} columns={columns} rowKey={(p) => p.id} caption="Project register" onRowClick={setOpen} initialSort={{ key: "stage", dir: "asc" }} />
      </Card>
      <Drawer open={open != null} onClose={() => setOpen(null)} title={open?.title ?? ""} subtitle={open ? `${open.proposalNo}${open.wbs ? ` · ${open.wbs}` : ""}` : undefined}>
        {open ? <ProjectList items={[open]} /> : null}
      </Drawer>
    </div>
  );
}
