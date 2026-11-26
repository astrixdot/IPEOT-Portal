import { useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import {
  AlarmClock,
  AlertOctagon,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Inbox,
  MessageSquareReply,
  Plus,
  Send,
  Undo2,
  Users,
} from "lucide-react";
import { CI_ID, inbox as inboxSeed, team, workspaces, type InboxItem, type Milestone } from "../data/ci";
import { person, TODAY } from "../data/org";
import { projects, stageMeta } from "../data/projects";
import { cx, daysFromToday, formatDate, formatShort } from "../lib/format";
import { useFakeLoad } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { AIPanel } from "../components/AIPanel";
import { Stepper } from "../components/ui/Stepper";
import { Avatar, Button, Card, CategoryBadge, EmptyState, IdChip, PageHeader, ProgressBar, Segmented, Skeleton, StatusBadge, type Tone } from "../components/ui/primitives";
import { Field, inputClass, Modal } from "../components/ui/Overlay";

const REPORT_STEPS = ["Draft", "I/C review", "HOD review", "HOI approval", "Published"];

const milestoneStyle: Record<Milestone["status"], { bar: string; fill: string; tone: Tone; label: string; icon: typeof CheckCircle2 }> = {
  done: { bar: "bg-teal/25", fill: "bg-teal", tone: "accent", label: "Done", icon: CheckCircle2 },
  active: { bar: "bg-cyan/20", fill: "bg-cyan", tone: "info", label: "In progress", icon: CircleDashed },
  upcoming: { bar: "bg-surface-3", fill: "bg-slate", tone: "neutral", label: "Planned", icon: CalendarClock },
  late: { bar: "bg-red/15", fill: "bg-red", tone: "critical", label: "Late", icon: AlertOctagon },
};

const inboxIcon: Record<InboxItem["kind"], typeof Inbox> = { lab: FlaskConical, data: Inbox, return: Undo2, reminder: AlarmClock };

function Gantt({ milestones, extensions }: { milestones: Milestone[]; extensions: Set<string> }) {
  const start = new Date(Math.min(...milestones.map((m) => new Date(m.start).getTime())));
  start.setDate(1);
  const endRaw = new Date(Math.max(...milestones.map((m) => new Date(m.end).getTime())));
  const end = new Date(endRaw.getFullYear(), endRaw.getMonth() + 1, 1);
  const span = end.getTime() - start.getTime();
  const pos = (value: string | Date) => ((new Date(value).getTime() - start.getTime()) / span) * 100;
  const months: Date[] = [];
  for (let d = new Date(start); d < end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d);
  const today = pos(TODAY);
  const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short" });

  return (
    <div>
      <div className="hidden grid-cols-[minmax(0,240px)_minmax(0,1fr)] gap-4 sm:grid">
        <span />
        <div className="relative h-5 text-[11px] text-ink-3">
          {months.map((month) => (
            <span key={month.toISOString()} className="absolute top-0 border-l border-line pl-1" style={{ left: `${pos(month)}%` }}>
              {monthFmt.format(month)}
            </span>
          ))}
        </div>
      </div>
      <ul className="mt-1 space-y-2.5 sm:space-y-1.5">
        {milestones.map((m) => {
          const style = milestoneStyle[m.status];
          const left = pos(m.start);
          const width = Math.max(2, pos(m.end) - left);
          const Icon = style.icon;
          return (
            <li key={m.name} className="grid gap-1 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:items-center sm:gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className={cx("size-4 shrink-0", m.status === "late" ? "text-red-ink" : m.status === "done" ? "text-teal-ink" : m.status === "active" ? "text-cyan-ink" : "text-ink-3")} aria-hidden />
                <span className="truncate text-[13px] text-ink" title={m.name}>
                  {m.name}
                </span>
                <span className="sr-only">
                  , {style.label}, {formatDate(m.start)} to {formatDate(m.end)}, {m.progress}% complete
                </span>
                {extensions.has(m.name) ? (
                  <StatusBadge tone="info" icon={CalendarPlus} className="ml-auto sm:hidden">
                    Ext. requested
                  </StatusBadge>
                ) : null}
              </div>
              <div className="relative h-7 rounded-md bg-surface-2/70">
                {today >= 0 && today <= 100 ? <span className="absolute inset-y-[-4px] z-10 w-px bg-orange" style={{ left: `${today}%` }} aria-hidden /> : null}
                <div className={cx("absolute inset-y-1 overflow-hidden rounded", style.bar, m.status === "late" && "ring-1 ring-red/40")} style={{ left: `${left}%`, width: `${width}%` }} title={`${m.name}: ${formatShort(m.start)} – ${formatShort(m.end)}`}>
                  <div className={cx("h-full transition-[width] duration-700", style.fill)} style={{ width: `${m.progress}%` }} />
                </div>
                <span
                  className="absolute inset-y-0 flex items-center text-[11px] font-semibold whitespace-nowrap text-ink-2 tabular"
                  style={left + width > 84 ? { right: `calc(${100 - left}% + 6px)` } : { left: `calc(${left + width}% + 6px)` }}
                >
                  {m.status === "upcoming" ? formatShort(m.end) : `${m.progress}%`}
                  {extensions.has(m.name) ? <CalendarPlus className="ml-1 hidden size-3.5 text-cyan-ink sm:inline" aria-label="Extension requested" /> : null}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2">
        {(Object.keys(milestoneStyle) as Milestone["status"][]).map((key) => {
          const Icon = milestoneStyle[key].icon;
          return (
            <span key={key} className="flex items-center gap-1.5">
              <span className={cx("h-2.5 w-4 rounded-sm", milestoneStyle[key].fill)} aria-hidden />
              <Icon className="size-3.5 text-ink-3" aria-hidden />
              {milestoneStyle[key].label}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-orange" aria-hidden />
          Today
        </span>
      </div>
    </div>
  );
}

export function CIWorkspace() {
  const toast = useToast();
  const navigate = useNavigate();
  const me = person(CI_ID)!;
  const myProjects = useMemo(() => workspaces.map((w) => ({ workspace: w, project: projects.find((p) => p.id === w.projectId)! })), []);
  const [selectedId, setSelectedId] = useState(myProjects[0].project.id);
  const selected = myProjects.find((item) => item.project.id === selectedId)!;
  const loading = useFakeLoad(600);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [inboxScope, setInboxScope] = useState<"all" | "project">("all");
  const [extensions, setExtensions] = useState<Record<string, Set<string>>>({});
  const [reportSteps, setReportSteps] = useState<Record<string, number>>(() => Object.fromEntries(workspaces.map((w) => [w.projectId, w.report.step])));
  const [extOpen, setExtOpen] = useState(false);
  const lateMilestone = selected.workspace.milestones.find((m) => m.status === "late") ?? selected.workspace.milestones.find((m) => m.status === "active") ?? selected.workspace.milestones[0];
  const [ext, setExt] = useState({ milestone: "", date: "", reason: "" });

  const openItems = inboxSeed.filter((item) => !done.has(item.id));
  const visibleInbox = (inboxScope === "all" ? inboxSeed : inboxSeed.filter((item) => item.projectId === selectedId)).filter((item) => !done.has(item.id));
  const step = reportSteps[selectedId];
  const ic = person(selected.project.icId)!;

  const openExtension = () => {
    const due = new Date(lateMilestone.end);
    due.setDate(due.getDate() + 21);
    setExt({ milestone: lateMilestone.name, date: due.toISOString().slice(0, 10), reason: "" });
    setExtOpen(true);
  };

  const submitExtension = () => {
    setExtensions((current) => ({ ...current, [selectedId]: new Set(current[selectedId] ?? []).add(ext.milestone) }));
    setExtOpen(false);
    toast.push("Time extension requested", `Sent to ${ic.name} (I/C) for “${ext.milestone}” to ${formatDate(ext.date)}.`, "success");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Chief Investigator workspace"
        title={`Good morning, ${me.name.split(" ").slice(0, 2).join(" ")}`}
        description={`${myProjects.length} active projects · ${openItems.length} pending actions · ${me.designation}, Corrosion & Materials`}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate("/proposals")}>
            New proposal
          </Button>
        }
      />

      <section aria-label="My projects">
        <h2 className="sr-only">My projects</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-4">
          {myProjects.map(({ project, workspace }, index) => {
            const active = project.id === selectedId;
            const due = project.nextMilestoneDue ? daysFromToday(project.nextMilestoneDue) : null;
            const late = workspace.milestones.some((m) => m.status === "late");
            const next = workspace.milestones.find((m) => m.status !== "done");
            return (
              <button
                key={project.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(project.id)}
                className={cx(
                  "reveal flex min-w-0 flex-col rounded-card border bg-surface p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop",
                  active ? "border-teal ring-2 ring-teal/30" : "border-line hover:border-line-strong",
                )}
                style={{ "--i": index + 1 } as CSSProperties}
              >
                {loading ? (
                  <>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-3 h-10 w-full" />
                    <Skeleton className="mt-4 h-2 w-full" />
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <IdChip>{project.wbs}</IdChip>
                      <CategoryBadge category={project.category} compact />
                      {late ? (
                        <StatusBadge tone="critical" className="ml-auto">
                          Late
                        </StatusBadge>
                      ) : project.stage === "report_approval" ? (
                        <StatusBadge tone="indigo" icon={FileText} className="ml-auto">
                          Report
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="accent" icon={CheckCircle2} className="ml-auto">
                          On track
                        </StatusBadge>
                      )}
                    </div>
                    <p className="mt-2.5 line-clamp-2 min-h-10 text-sm font-semibold text-ink">{project.title}</p>
                    <p className="mt-1 text-xs text-ink-3">{project.workCentre}</p>
                    <ProgressBar className="mt-3" value={project.progress} tone={late ? "warning" : "accent"} showValue label={`${project.title} progress`} />
                    <div className="mt-3 border-t border-line pt-2.5 text-xs">
                      <p className="text-ink-3">Next milestone</p>
                      <p className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-ink-2">{next?.name ?? stageMeta(project.stage).label}</span>
                        {next ? (
                          <span className={cx("shrink-0 font-semibold tabular", next.status === "late" || (due != null && due < 0) ? "text-red-ink" : "text-ink-2")}>
                            {next.status === "late" ? `${Math.abs(daysFromToday(next.end))} d late` : formatShort(next.end)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Card
          index={5}
          className="col-span-12 xl:col-span-8"
          title="Project Activity Schedule"
          subtitle={`${selected.project.title} · ${formatShort(selected.workspace.milestones[0].start)} – ${formatDate(selected.workspace.milestones.at(-1)!.end)}`}
          actions={
            <Button size="sm" icon={CalendarPlus} onClick={openExtension}>
              Request time extension
            </Button>
          }
        >
          {loading ? <Skeleton className="h-56" /> : <Gantt milestones={selected.workspace.milestones} extensions={extensions[selectedId] ?? new Set()} />}
          {(() => {
            const ms = selected.workspace.milestones;
            const late = ms.find((m) => m.status === "late");
            const pas = selected.workspace.iso.find((doc) => doc.type === "PAS");
            const requested = extensions[selectedId]?.size ?? 0;
            return (
              <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Milestones done", value: `${ms.filter((m) => m.status === "done").length} of ${ms.length}`, cls: "text-ink" },
                  { label: "Current slip", value: late ? `${Math.abs(daysFromToday(late.end))} d` : "None", cls: late ? "text-red-ink" : "text-teal-ink" },
                  { label: "Planned completion", value: formatDate(ms.at(-1)!.end), cls: "text-ink" },
                  { label: "PAS version", value: `${pas?.version ?? "—"}${requested ? ` · ${requested} ext. pending` : ""}`, cls: requested ? "text-cyan-ink" : "text-ink" },
                ].map((item) => (
                  <div key={item.label} className="min-w-0 rounded-lg bg-surface-2 px-3 py-2">
                    <dt className="text-[11px] text-ink-3">{item.label}</dt>
                    <dd className={cx("mt-0.5 truncate text-sm font-semibold tabular", item.cls)}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            );
          })()}
        </Card>

        <Card
          index={6}
          className="col-span-12 xl:col-span-4"
          title="Pending actions"
          subtitle={`${openItems.length} open · ${openItems.filter((item) => item.urgent).length} urgent`}
          actions={
            <Segmented
              label="Inbox scope"
              value={inboxScope}
              onChange={setInboxScope}
              options={[
                { value: "all", label: "All" },
                { value: "project", label: "This project" },
              ]}
            />
          }
          bodyClassName="!px-0 !pb-2"
        >
          {visibleInbox.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="You’re all caught up">
              No pending actions {inboxScope === "project" ? "for this project" : "right now"}.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line scroll-thin xl:max-h-[452px] xl:overflow-y-auto">
              {visibleInbox.map((item) => {
                const Icon = inboxIcon[item.kind];
                const project = projects.find((p) => p.id === item.projectId);
                return (
                  <li key={item.id} className="flex gap-3 px-5 py-3">
                    <span className={cx("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", item.urgent ? "bg-amber-soft text-amber-ink" : "bg-surface-2 text-ink-2")}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">
                        {item.title}
                        {item.urgent ? <span className="sr-only"> (urgent)</span> : null}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-3">{item.detail}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-ink-3">
                        <span className="font-mono">{project?.wbs}</span>
                        <span aria-hidden>·</span>
                        <span>{item.from}</span>
                        <span aria-hidden>·</span>
                        <span>{item.age}</span>
                      </p>
                      <Button
                        size="sm"
                        variant={item.urgent ? "primary" : "secondary"}
                        className="mt-2"
                        onClick={() => {
                          setDone((current) => new Set(current).add(item.id));
                          toast.push(item.action, `${item.title} – marked done.`, "success");
                        }}
                      >
                        {item.action}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          index={7}
          className="col-span-12 lg:col-span-7"
          title="Report approval"
          subtitle={step >= 4 ? "Published to the Knowledge Base" : `With ${["you (CI)", ic.name + " (I/C)", "Dr. Prakash Iyer (HOD)", "Dr. Rajiv Malhotra (HOI)"][step]} · comments shown per stage`}
          actions={
            step === 0 ? (
              <Button
                size="sm"
                variant="primary"
                icon={Send}
                onClick={() => {
                  setReportSteps((current) => ({ ...current, [selectedId]: 1 }));
                  toast.push("Report submitted to I/C", `${ic.name} has been notified.`, "success");
                }}
              >
                Submit to I/C
              </Button>
            ) : step < 4 ? (
              <Button size="sm" icon={MessageSquareReply} onClick={() => toast.push("Comments opened", `${selected.workspace.report.comments.reduce((a, b) => a + b, 0)} comments on the current draft.`, "info")}>
                View comments
              </Button>
            ) : null
          }
        >
          <Stepper
            label="Report approval stages"
            current={step}
            steps={REPORT_STEPS.map((label, index) => ({
              label,
              caption: index < step ? "Cleared" : index === step ? (index === 0 ? "With you" : "Pending") : undefined,
              comments: selected.workspace.report.comments[index] || undefined,
            }))}
          />
          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            {[
              { label: "Report", value: step === 0 ? "Draft v0.3" : "v1.0" },
              { label: "Open comments", value: String(selected.workspace.report.comments.slice(0, step + 1).reduce((a, b) => a + b, 0)) },
              { label: "Approval target", value: "15 d per level" },
              { label: "Accession on publish", value: "Auto-assigned" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-surface-2 px-3 py-2">
                <dt className="text-ink-3">{item.label}</dt>
                <dd className="mt-0.5 font-semibold text-ink tabular">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card index={8} className="col-span-12 lg:col-span-5" title="ISO documents" subtitle="Controlled records for this project">
          <ul className="space-y-2.5">
            {selected.workspace.iso.map((doc) => {
              const level = doc.status === "Approved" ? 3 : doc.status === "In Review" ? 2 : 1;
              const tone: Tone = doc.status === "Approved" ? "success" : doc.status === "In Review" ? "info" : "neutral";
              return (
                <li key={doc.type} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2 font-mono text-[12px] font-bold text-ink-2">{doc.type}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{doc.name}</p>
                      <span className="font-mono text-xs text-ink-3">{doc.version}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-3">
                      Edited {formatShort(doc.editedAt)} by {doc.editedBy}
                    </p>
                    <div className="mt-2 flex gap-1" aria-hidden>
                      {[1, 2, 3].map((n) => (
                        <span key={n} className={cx("h-1 flex-1 rounded-full", n <= level ? (level === 3 ? "bg-green" : "bg-cyan") : "bg-surface-3")} />
                      ))}
                    </div>
                  </div>
                  <StatusBadge tone={tone}>{doc.status}</StatusBadge>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="col-span-12 xl:col-span-7">
          <AIPanel workspace={selected.workspace} projectTitle={selected.project.title} index={9} />
        </div>

        <div className="col-span-12 flex flex-col gap-4 xl:col-span-5">
          <Card
            index={10}
            title="Lab results (LIMS)"
            subtitle={`Samples linked to ${selected.project.wbs}`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => navigate(`/lims?q=${encodeURIComponent(selected.project.wbs ?? "")}`)}>
                Open in LIMS
              </Button>
            }
          >
            <dl className="grid grid-cols-3 gap-2">
              {[
                { label: "Received", value: selected.workspace.lims.received, cls: "text-ink" },
                { label: "In testing", value: selected.workspace.lims.inProgress, cls: "text-cyan-ink" },
                { label: "Awaiting approval", value: selected.workspace.lims.awaiting, cls: "text-amber-ink" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-surface-2 px-3 py-2">
                  <dd className={cx("font-display text-xl font-semibold tabular", item.cls)}>{item.value}</dd>
                  <dt className="text-[11px] text-ink-3">{item.label}</dt>
                </div>
              ))}
            </dl>
            <ul className="mt-3 divide-y divide-line">
              {selected.workspace.lims.results.map((result) => (
                <li key={result.sampleId} className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <IdChip>{result.sampleId}</IdChip>
                    <StatusBadge tone={result.status === "Released" ? "success" : result.status === "Testing" ? "info" : "warning"}>{result.status}</StatusBadge>
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink">{result.test}</p>
                  <p className="mt-0.5 flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink-3">{result.standard}</span>
                    <span className="font-mono font-semibold text-ink-2">{result.value}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card index={11} title={<span className="flex items-center gap-2"><Users className="size-4 text-ink-3" aria-hidden />Team</span>} subtitle="Workload across all active projects">
            <ul className="space-y-3">
              {team.map((member) => {
                const ratio = member.active / member.capacity;
                return (
                  <li key={member.id} className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-ink">{member.name}</span>
                        <span className={cx("shrink-0 text-xs font-semibold tabular", ratio >= 1 ? "text-amber-ink" : "text-ink-2")}>
                          {member.active}/{member.capacity}
                          <span className="sr-only"> tasks of capacity</span>
                        </span>
                      </p>
                      <p className="text-xs text-ink-3">{member.role}</p>
                      <ProgressBar className="mt-1" value={ratio * 100} tone={ratio >= 1 ? "warning" : "accent"} label={`${member.name} workload`} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <Modal
        open={extOpen}
        onClose={() => setExtOpen(false)}
        title="Request time extension"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExtOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={Send} onClick={submitExtension} disabled={ext.reason.trim().length < 10}>
              Send to I/C
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-2">
            The request goes to <span className="font-semibold text-ink">{ic.name}</span> (I/C) and updates the PAS once approved.
          </p>
          <Field label="Milestone">
            <select value={ext.milestone} onChange={(event) => setExt({ ...ext, milestone: event.target.value })} className={inputClass}>
              {selected.workspace.milestones
                .filter((m) => m.status !== "done")
                .map((m) => (
                  <option key={m.name}>{m.name}</option>
                ))}
            </select>
          </Field>
          <Field label="New end date" hint={`Current end date: ${formatDate(selected.workspace.milestones.find((m) => m.name === ext.milestone)?.end)}`}>
            <input type="date" value={ext.date} onChange={(event) => setExt({ ...ext, date: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Justification" hint="At least 10 characters. Shared with the I/C and recorded in the PAS history.">
            <textarea
              rows={4}
              value={ext.reason}
              onChange={(event) => setExt({ ...ext, reason: event.target.value })}
              placeholder="Produced water analysis from the work centre is still awaited (requested 04 Nov)."
              className={cx(inputClass, "h-auto py-2")}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
