import { useMemo, useState } from "react";
import { CheckCheck, CheckCircle2, MessageSquare, Search, Undo2 } from "lucide-react";
import type { Project, Role } from "../data/types";
import { department, person } from "../data/org";
import { projects, STAGES, stageMeta, stageTarget, overdueDays } from "../data/projects";
import { approvalQueue, ROLES, roleMeta, useRole } from "../lib/role";
import { useToast } from "../lib/toast";
import { cx } from "../lib/format";
import { Button, Card, CategoryBadge, EmptyState, IdChip, PageHeader, Segmented, StatusBadge } from "../components/ui/primitives";
import { Stepper } from "../components/ui/Stepper";
import { inputClass } from "../components/ui/Overlay";
import { stageStatus } from "../components/ProjectRow";

function ApprovalCard({ project, onDecide }: { project: Project; onDecide: (project: Project, decision: "approve" | "return", note: string) => void }) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const status = stageStatus(project);
  const target = stageTarget(project);
  const isReport = project.stage === "report_approval";
  return (
    <li className="reveal rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <IdChip>{project.wbs ?? project.proposalNo}</IdChip>
        <CategoryBadge category={project.category} />
        <StatusBadge tone={isReport ? "indigo" : "info"} icon={null}>
          {isReport ? "Report" : stageMeta(project.stage).short}
        </StatusBadge>
        <StatusBadge tone={status.tone} icon={status.icon} className="sm:ml-auto">
          {status.text}
        </StatusBadge>
      </div>
      <h3 className="mt-2.5 text-[15px] font-semibold text-ink">{project.title}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-ink-3">Department</dt>
          <dd className="font-medium text-ink-2">{department(project.departmentId).code}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Work centre</dt>
          <dd className="truncate font-medium text-ink-2">{project.workCentre}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Chief Investigator</dt>
          <dd className="truncate font-medium text-ink-2">{person(project.ciId)?.name}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Waiting</dt>
          <dd className={cx("font-medium", overdueDays(project) > 0 ? "text-red-ink" : "text-ink-2")}>
            {project.daysInStage} d{target ? ` of ${target}` : ""}
          </dd>
        </div>
      </dl>
      {showNote ? (
        <div className="mt-3">
          <label className="sr-only" htmlFor={`note-${project.id}`}>
            Remarks for {project.title}
          </label>
          <textarea id={`note-${project.id}`} rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Remarks (required when returning)" className={cx(inputClass, "h-auto py-2")} />
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button variant="ghost" icon={MessageSquare} onClick={() => setShowNote(!showNote)} className="col-span-2 h-11 sm:h-9" aria-expanded={showNote}>
          {showNote ? "Hide remarks" : "Add remarks"}
        </Button>
        <Button
          icon={Undo2}
          className="h-11 sm:h-9"
          onClick={() => {
            if (!note.trim()) {
              setShowNote(true);
              return;
            }
            onDecide(project, "return", note);
          }}
        >
          Return
        </Button>
        <Button variant="primary" icon={CheckCircle2} className="h-11 sm:h-9" onClick={() => onDecide(project, "approve", note)}>
          {isReport ? "Approve report" : "Approve"}
        </Button>
      </div>
    </li>
  );
}

export function ApprovalsPage() {
  const { role, setRole } = useRole();
  const toast = useToast();
  const [decided, setDecided] = useState<Set<string>>(new Set());
  const [track, setTrack] = useState("");
  const queue = useMemo(() => approvalQueue(role, projects).filter((p) => !decided.has(p.id)).sort((a, b) => overdueDays(b) - overdueDays(a)), [role, decided]);
  const tracked = track.trim().length >= 3 ? projects.find((p) => [p.proposalNo, p.wbs ?? "", p.title].some((field) => field.toLowerCase().includes(track.trim().toLowerCase()))) : undefined;

  const decide = (project: Project, decision: "approve" | "return", note: string) => {
    setDecided((current) => new Set(current).add(project.id));
    toast.push(
      decision === "approve" ? "Approved" : "Returned to Chief Investigator",
      decision === "approve" ? `${project.title} moved to the next level.` : `Remarks sent to ${person(project.ciId)?.name}: “${note.slice(0, 60)}${note.length > 60 ? "…" : ""}”`,
      decision === "approve" ? "success" : "info",
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Approvals"
        title="Awaiting your decision"
        description={`${roleMeta(role).user.name} · ${roleMeta(role).label} · ${queue.length} item${queue.length === 1 ? "" : "s"} in your queue, most overdue first`}
        actions={<Segmented<Role> label="Approver role" value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r.key, label: r.label }))} />}
      />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          {queue.length === 0 ? (
            <Card>
              <EmptyState icon={CheckCheck} title="Queue cleared">
                Nothing is waiting for the {roleMeta(role).label}. New items appear here with an e-mail alert.
              </EmptyState>
            </Card>
          ) : (
            <ul className="space-y-3">
              {queue.map((project) => (
                <ApprovalCard key={project.id} project={project} onDecide={decide} />
              ))}
            </ul>
          )}
        </div>
        <Card index={2} className="col-span-12 self-start lg:col-span-4" title="Track a proposal" subtitle="Check the status of any proposal or project">
          <label className="relative block">
            <span className="sr-only">Proposal number, WBS or title</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input value={track} onChange={(event) => setTrack(event.target.value)} placeholder="PR/2026/0184, WBS or title" className={cx(inputClass, "pl-9")} />
          </label>
          {tracked ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-ink">{tracked.title}</p>
              <p className="mt-0.5 text-xs text-ink-3">
                {tracked.proposalNo} · with {tracked.pendingWith}
              </p>
              <ol className="mt-4 space-y-0" aria-label="Stage history">
                {STAGES.map((stage, index) => {
                  const current = STAGES.findIndex((s) => s.key === tracked.stage);
                  const done = index < current || tracked.stage === "closed";
                  const active = index === current && tracked.stage !== "closed";
                  return (
                    <li key={stage.key} className="relative flex gap-3 pb-3 last:pb-0" aria-current={active ? "step" : undefined}>
                      {index < STAGES.length - 1 ? <span className={cx("absolute top-5 bottom-0 left-[9px] w-0.5", done ? "bg-teal" : "bg-surface-3")} aria-hidden /> : null}
                      <span className={cx("relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold", done ? "bg-teal text-white dark:text-navy" : active ? "bg-surface text-teal-ink ring-2 ring-teal" : "bg-surface-3 text-ink-3")}>
                        {done ? <CheckCircle2 className="size-3.5" aria-hidden /> : index + 1}
                      </span>
                      <div className="min-w-0 text-sm">
                        <p className={cx("font-medium", active ? "text-ink" : done ? "text-ink-2" : "text-ink-3")}>
                          {stage.label}
                          <span className="sr-only">, {done ? "completed" : active ? "current" : "upcoming"}</span>
                        </p>
                        <p className="text-xs text-ink-3">{done && tracked.history[stage.key] != null ? `${tracked.history[stage.key]} d` : active ? `${tracked.daysInStage} d so far${stageTarget(tracked) ? ` · target ${stageTarget(tracked)} d` : ""}` : ""}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : track.trim().length >= 3 ? (
            <p className="mt-4 text-sm text-ink-3">No proposal matches “{track}”.</p>
          ) : (
            <div className="mt-4">
              <p className="mb-3 text-xs text-ink-3">Example: a proposal at the HOD stage</p>
              <Stepper label="Example progress" current={2} steps={[{ label: "Proposal" }, { label: "I/C" }, { label: "HOD" }, { label: "HOI" }]} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
