import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api, errorText } from "../api";
import { can } from "../access";
import { useSession } from "../auth";
import { Banner, btn, btnGhost, formatWhen, statusLabel } from "../ui";

type Task = {
  id: number;
  kind?: string;
  stageName: string | null;
  stageCode: string;
  dueAt: string | null;
  projectTitle: string;
  proposalId: number | null;
  proposalNumber: string | null;
};

type Proposal = {
  id: number;
  proposalNumber: string;
  title: string;
  status: string;
  projectCategory: string;
  departmentCode: string;
};

type Awp = {
  id: number;
  year: number;
  title: string;
  status: string;
  windowOpen: string | null;
  windowClose: string | null;
  filed: number;
};

type Dashboard = {
  projects: number;
  myPendingTasks: number;
  openAwpCycles: number;
  departments: number;
  projectTypes: number;
  inReview: number;
  authorized: number;
  statuses: { status: string; count: number }[];
  tasks: Task[];
  proposals: Proposal[];
  awp: Awp | null;
};

const statusOrder = [
  "draft", "submitted", "department_review", "clarification", "incharge_review",
  "plan_scheduled", "plan_unscheduled", "hod_endorsed", "pcc_consolidation",
  "hoi_review", "tac_review", "director_approved", "published",
  "in_year_approved", "in_progress", "short_term_closed",
  "in_review", "scope_modification", "endorsed", "authorized",
  "authorized_pending_wbs", "report_review", "closed", "removed", "rejected", "cancelled",
];

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function segmentClass(status: string) {
  if (["authorized", "endorsed", "in_progress", "published", "director_approved", "hod_endorsed", "in_year_approved", "plan_scheduled"].includes(status)) return "bg-accent";
  if (["rejected", "cancelled", "removed"].includes(status)) return "bg-danger";
  if (status === "draft") return "bg-ink/20";
  return "bg-ink";
}

export function DashboardPage() {
  const session = useSession();
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<{ data: Dashboard }>("/api/crud/v1/dashboard"),
  });
  const notes = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ data: { id: number; title: string; body: string | null; createdAt: string }[] }>("/api/crud/v1/notifications/mine"),
  });
  const user = session.data?.user;
  const data = query.data?.data;
  const counts = new Map((data?.statuses || []).map((row) => [row.status, row.count]));
  const pipeline = statusOrder.filter((status) => counts.get(status)).map((status) => ({ status, count: counts.get(status) || 0 }));
  const total = pipeline.reduce((sum, row) => sum + row.count, 0) || 1;
  const roleLine = user?.roles.map((role) => `${role.name}${role.delegated ? " · acting" : ""}`).join("  ·  ");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-mute uppercase">{todayLabel()}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">{greeting()}, {user?.name}</h1>
          <p className="mt-2 text-sm text-mute">{roleLine}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can(user, "proposals.write") ? <Link className={btn} to="/proposals/new">New proposal</Link> : null}
          {can(user, "workflow.act") ? <Link className={btnGhost} to="/inbox">Inbox</Link> : null}
          {can(user, "awp.read") ? <Link className={btnGhost} to="/awp">Programme</Link> : null}
        </div>
      </header>

      {query.isError ? <div className="mt-6"><Banner>{errorText(query.error)}</Banner></div> : null}
      {(notes.data?.data.length || 0) > 0 ? (
        <section className="mt-6 rounded-3xl border border-line bg-paper p-6">
          <h2 className="text-sm font-semibold text-ink">Notices</h2>
          <ul className="mt-3 space-y-3">
            {notes.data?.data.slice(0, 4).map((note) => (
              <li key={note.id}>
                <p className="text-sm font-medium text-ink">{note.title}</p>
                <p className="text-sm text-mute">{note.body}</p>
                <p className="text-xs text-mute">{formatWhen(note.createdAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 grid overflow-hidden rounded-3xl border border-line bg-paper sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-line">
        <Metric label="Waiting on you" value={data?.myPendingTasks} note="In your inbox" to={can(user, "workflow.act") ? "/inbox" : undefined} emphasis={(data?.myPendingTasks || 0) > 0} />
        <Metric label="In review" value={data?.inReview} note="With a reviewer" to={can(user, "proposals.read") ? "/proposals" : undefined} />
        <Metric label="Authorised" value={data?.authorized} note="Cleared to proceed" to={can(user, "projects.read") ? "/projects" : undefined} emphasis />
        <Metric label="Open windows" value={data?.openAwpCycles} note={`${data?.departments ?? "—"} departments · ${data?.projectTypes ?? "—"} studies`} to={can(user, "awp.read") ? "/awp" : undefined} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {can(user, "workflow.act") ? (
          <Panel className="lg:col-span-3" title="Queue" action={<Link className="text-sm text-mute hover:text-ink" to="/inbox">View all</Link>}>
            {data && data.tasks.length === 0 ? <p className="text-sm text-mute">Nothing is waiting on you.</p> : null}
            <ul>
              {(data?.tasks || []).map((task) => (
                <li key={`${task.kind || "proposal"}-${task.id}`} className="flex items-start justify-between gap-4 border-t border-line py-4 first:border-t-0 first:pt-0">
                  <div className="min-w-0">
                    {task.proposalId ? (
                      <Link className="font-medium text-ink hover:text-accent" to={`/proposals/${task.proposalId}`}>{task.proposalNumber}</Link>
                    ) : <Link className="font-medium text-ink hover:text-accent" to="/awp">{task.projectTitle}</Link>}
                    {task.proposalId ? <p className="truncate text-sm text-mute">{task.projectTitle}</p> : null}
                    <p className="mt-1 text-xs text-mute">{task.stageName || task.stageCode}</p>
                  </div>
                  <p className={`shrink-0 text-xs ${task.dueAt && new Date(task.dueAt).getTime() < Date.now() ? "font-medium text-danger" : "text-mute"}`}>
                    {formatWhen(task.dueAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {can(user, "awp.read") ? (
          <section className="rounded-3xl bg-ink p-6 text-paper lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium tracking-[0.16em] text-paper/60 uppercase">Annual programme</p>
              <Link className="text-sm text-paper/70 hover:text-paper" to="/awp">Open</Link>
            </div>
            {data?.awp ? (
              <>
                <p className="mt-6 text-2xl font-semibold tracking-tight">{data.awp.title}</p>
                <p className="mt-2 text-sm capitalize text-paper/70">{data.awp.status} · {data.awp.year}</p>
                <p className="mt-6 text-5xl font-semibold tracking-tight tabular-nums">{data.awp.filed}</p>
                <p className="mt-1 text-sm text-paper/70">scheduled {data.awp.filed === 1 ? "study" : "studies"} filed</p>
                <p className="mt-6 text-xs leading-5 text-paper/60">{formatWhen(data.awp.windowOpen)} — {formatWhen(data.awp.windowClose)}</p>
              </>
            ) : <p className="mt-6 text-sm text-paper/70">No programme has been opened.</p>}
          </section>
        ) : null}

        {can(user, "proposals.read") ? (
          <Panel className="lg:col-span-3" title="Latest proposals" action={<Link className="text-sm text-mute hover:text-ink" to="/proposals">Register</Link>}>
            {data && data.proposals.length === 0 ? <p className="text-sm text-mute">No proposals yet.</p> : null}
            <ul>
              {(data?.proposals || []).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-4 border-t border-line py-4 first:border-t-0 first:pt-0">
                  <div className="min-w-0">
                    <Link className="font-medium text-ink hover:text-accent" to={`/proposals/${row.id}`}>{row.proposalNumber}</Link>
                    <p className="truncate text-sm text-mute">{row.title}</p>
                  </div>
                  <p className="shrink-0 text-xs capitalize text-mute">{row.departmentCode} · {statusLabel(row.status)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <Panel className={can(user, "proposals.read") || can(user, "workflow.act") ? "lg:col-span-2" : "lg:col-span-5"} title="Where studies stand">
          {pipeline.length === 0 ? <p className="text-sm text-mute">No studies have been filed.</p> : null}
          {pipeline.length > 0 ? (
            <>
              <div className="flex h-2 overflow-hidden rounded-full bg-canvas">
                {pipeline.map((row) => (
                  <div key={row.status} className={segmentClass(row.status)} style={{ width: `${(row.count / total) * 100}%` }} />
                ))}
              </div>
              <ul className="mt-5 space-y-3">
                {pipeline.map((row) => (
                  <li key={row.status} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 capitalize text-mute">
                      <span className={`h-2 w-2 rounded-full ${segmentClass(row.status)}`} />
                      {statusLabel(row.status)}
                    </span>
                    <span className="font-medium tabular-nums text-ink">{row.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, action, className, children }: { title: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-3xl border border-line bg-paper p-6 ${className || ""}`}>
      <header className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-tight text-ink">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Metric({ label, value, note, to, emphasis }: { label: string; value: number | undefined; note: string; to?: string; emphasis?: boolean }) {
  const body = (
    <div className="px-6 py-6">
      <p className="text-xs font-medium tracking-[0.14em] text-mute uppercase">{label}</p>
      <p className={`mt-3 text-5xl font-semibold tracking-tight tabular-nums ${emphasis ? "text-accent" : "text-ink"}`}>{value ?? "—"}</p>
      <p className="mt-2 text-sm text-mute">{note}</p>
    </div>
  );
  if (!to) return body;
  return <Link to={to} className="block hover:bg-canvas">{body}</Link>;
}
