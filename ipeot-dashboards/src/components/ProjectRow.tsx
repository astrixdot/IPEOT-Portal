import { AlertOctagon, CheckCircle2, Clock3, Hourglass } from "lucide-react";
import type { Project } from "../data/types";
import { department, person } from "../data/org";
import { isOverdue, overdueDays, stageMeta, stageTarget } from "../data/projects";
import { CategoryBadge, IdChip, StatusBadge, type Tone } from "./ui/primitives";

export function stageStatus(project: Project): { tone: Tone; text: string; icon: typeof Clock3 } {
  if (project.stage === "closed") return { tone: "success", text: "Closed", icon: CheckCircle2 };
  const late = overdueDays(project);
  if (late > 14) return { tone: "critical", text: `${late} d overdue`, icon: AlertOctagon };
  if (late > 0) return { tone: "warning", text: `${late} d overdue`, icon: Clock3 };
  if (project.stage === "execution") return { tone: "accent", text: "On track", icon: CheckCircle2 };
  return { tone: "info", text: "Within target", icon: Hourglass };
}

export function ProjectRow({ project }: { project: Project }) {
  const status = stageStatus(project);
  const target = stageTarget(project);
  return (
    <li className="px-5 py-4 transition-colors hover:bg-surface-2/60">
      <div className="flex flex-wrap items-center gap-1.5">
        <IdChip>{project.wbs ?? project.proposalNo}</IdChip>
        <CategoryBadge category={project.category} />
        <StatusBadge tone={status.tone} icon={status.icon}>
          {status.text}
        </StatusBadge>
      </div>
      <p className="mt-2 text-sm font-semibold text-ink">{project.title}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-ink-3">Stage</dt>
          <dd className="font-medium text-ink-2">{stageMeta(project.stage).label}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Pending with</dt>
          <dd className="truncate font-medium text-ink-2" title={project.pendingWith}>
            {project.pendingWith}
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">{project.stage === "execution" ? "Progress" : "Days at stage"}</dt>
          <dd className={isOverdue(project) ? "font-semibold text-red-ink" : "font-medium text-ink-2"}>
            {project.stage === "execution" ? `${project.progress}%` : `${project.daysInStage} d${target ? ` / ${target} d target` : ""}`}
          </dd>
        </div>
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
      </dl>
    </li>
  );
}

export function ProjectList({ items }: { items: Project[] }) {
  return <ul className="divide-y divide-line">{items.map((project) => <ProjectRow key={project.id} project={project} />)}</ul>;
}
