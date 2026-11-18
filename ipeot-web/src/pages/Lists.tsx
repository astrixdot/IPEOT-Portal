import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { api, errorText } from "../api";
import { can } from "../access";
import { useSession } from "../auth";
import { Banner, Empty, PageHeader, btn, btnGhost, field, formatWhen, statusLabel } from "../ui";

export function ProjectsPage() {
  return (
    <ListPage
      title="Projects"
      detail="Studies appear here from the first draft through publication, including in-year and short-term work."
      path="/api/crud/v1/projects"
      empty="No projects yet."
      columns={["Title", "Department", "Category", "Status"]}
      render={(row) => [
        String(row.title),
        `${row.departmentCode} · ${row.departmentName}`,
        statusLabel(String(row.projectCategory)),
        statusLabel(String(row.status)),
      ]}
    />
  );
}

type InboxTask = {
  id: number;
  kind?: string;
  cycleId?: number | null;
  stageName: string | null;
  stageCode: string;
  dueAt: string | null;
  projectTitle: string;
  proposalId: number | null;
  proposalNumber: string | null;
};

export function InboxPage() {
  const query = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api<{ data: InboxTask[] }>("/api/crud/v1/tasks/mine"),
  });
  return (
    <div>
      <PageHeader title="Inbox" detail="Open a study to take the next step. A consolidated AWP is handled on the annual work programme page." />
      {query.isError ? <Banner>{errorText(query.error)}</Banner> : null}
      {query.data && query.data.data.length === 0 ? <Empty>No pending tasks.</Empty> : null}
      {query.data && query.data.data.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Proposal", "Stage", "Due"].map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}</tr>
            </thead>
            <tbody>
              {query.data.data.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    {row.kind === "package" ? (
                      <Link className="font-medium text-ink hover:text-accent" to="/awp">{row.projectTitle}</Link>
                    ) : row.proposalId ? (
                      <Link className="font-medium text-ink hover:text-accent" to={`/proposals/${row.proposalId}`}>{row.proposalNumber} · {row.projectTitle}</Link>
                    ) : row.projectTitle}
                  </td>
                  <td className="px-3 py-2">{row.stageName || row.stageCode}</td>
                  <td className="px-3 py-2">{formatWhen(row.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

type FiledProposal = {
  projectId: number;
  cycleId: number;
  departmentCode: string;
  departmentName: string;
  proposalId: number;
  proposalNumber: string;
  title: string;
  status: string;
  finalQuarter?: string | null;
  scheduleDecision?: string | null;
  priority?: number | null;
};

type Cycle = {
  id: number;
  year: number;
  title: string;
  status: string;
  windowOpen: string | null;
  windowClose: string | null;
  packageStatus?: string | null;
  invitationSentAt?: string | null;
  mastersUpdatedAt?: string | null;
  publishedAt?: string | null;
  hasConsolidation?: boolean;
  hasDisha?: boolean;
  proposals: FiledProposal[];
};

type PackageTask = {
  id: number;
  kind?: string;
  cycleId?: number | null;
  stageCode: string;
  stageName: string | null;
  actions?: { action: string; label: string }[];
};

function DepartmentPlan({ cycle }: { cycle: Cycle }) {
  const groups = new Map<string, { name: string; rows: FiledProposal[] }>();
  for (const row of cycle.proposals) {
    const group = groups.get(row.departmentCode) || { name: row.departmentName, rows: [] };
    group.rows.push(row);
    groups.set(row.departmentCode, group);
  }
  const heading = cycle.status === "closed" ? "Department plan" : "Filed in this window";
  return (
    <div className="border-t border-slate-100 px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      {cycle.proposals.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          {cycle.status === "closed" ? "No scheduled studies were filed in this window." : "No scheduled studies have been filed yet."}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {[...groups.entries()].map(([code, group]) => (
            <div key={code}>
              <p className="text-xs font-semibold tracking-wide text-slate-500">{code} · {group.name}</p>
              <ul className="mt-1 space-y-1">
                {group.rows.map((row) => (
                  <li key={row.proposalId} className="text-sm">
                    <Link className="font-medium text-ink hover:text-accent" to={`/proposals/${row.proposalId}`}>{row.proposalNumber}</Link>
                    <span className="text-slate-700"> · {row.title} · {statusLabel(row.status)}{row.finalQuarter ? ` · ${row.finalQuarter}` : ""}{row.scheduleDecision === "unscheduled" ? " · no timeline" : ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AwpPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const writable = can(session.data?.user, "awp.write");
  const [year, setYear] = useState("2026");
  const [title, setTitle] = useState("Annual work programme 2026");
  const [windowOpen, setWindowOpen] = useState("");
  const [windowClose, setWindowClose] = useState("");
  const [mastersUpdated, setMastersUpdated] = useState(true);
  const [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: ["/api/crud/v1/awp/cycles"],
    queryFn: () => api<{ data: Cycle[] }>("/api/crud/v1/awp/cycles"),
  });
  const openCycle = useMutation({
    mutationFn: () => api("/api/crud/v1/awp/cycles", {
      method: "POST",
      body: JSON.stringify({
        year: Number(year),
        title,
        windowOpen: new Date(windowOpen).toISOString(),
        windowClose: new Date(windowClose).toISOString(),
        status: "open",
        mastersUpdated,
      }),
    }),
    onSuccess: async () => {
      setMessage("");
      setWindowOpen("");
      setWindowClose("");
      await queryClient.invalidateQueries({ queryKey: ["/api/crud/v1/awp/cycles"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  const setStatus = useMutation({
    mutationFn: (input: { id: number; status: string }) => api(`/api/crud/v1/awp/cycles/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: input.status }),
    }),
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["/api/crud/v1/awp/cycles"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  const act = useMutation({
    mutationFn: (input: { path: string; body?: unknown }) => api(input.path, {
      method: "POST",
      body: JSON.stringify(input.body || {}),
    }),
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["/api/crud/v1/awp/cycles"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  const packageTasks = useQuery({
    queryKey: ["tasks"],
    enabled: can(session.data?.user, "workflow.act"),
    queryFn: () => api<{ data: PackageTask[] }>("/api/crud/v1/tasks/mine"),
  });
  const ready = year.trim() && title.trim() && windowOpen && windowClose;
  return (
    <div>
      <PageHeader title="Annual work programme" detail="PCC updates the asset, plant, and service list, invites coordinators, and later consolidates every department into one plan for HOI, TAC, and the Director." />
      {query.isError ? <Banner>{errorText(query.error)}</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}
      {writable ? (
        <form className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); openCycle.mutate(); }}>
          <label className="block text-sm">Year
            <input className={`${field} mt-1`} inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} required />
          </label>
          <label className="block text-sm">Title
            <input className={`${field} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="block text-sm">Opens
            <input className={`${field} mt-1`} type="datetime-local" value={windowOpen} onChange={(event) => setWindowOpen(event.target.value)} required />
          </label>
          <label className="block text-sm">Closes
            <input className={`${field} mt-1`} type="datetime-local" value={windowClose} onChange={(event) => setWindowClose(event.target.value)} required />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={mastersUpdated} onChange={(event) => setMastersUpdated(event.target.checked)} />
            Asset, plant, and service masters are updated for this cycle
          </label>
          <div className="md:col-span-2">
            <button className={btn} type="submit" disabled={!ready || openCycle.isPending}>{openCycle.isPending ? "Opening…" : "Open AWP and invite coordinators"}</button>
          </div>
        </form>
      ) : null}
      {writable ? <MastersPanel /> : null}
      {query.data && query.data.data.length === 0 ? <Empty>No AWP cycles have been opened.</Empty> : null}
      {query.data && query.data.data.length > 0 ? (
        <div className="space-y-4">
          {query.data.data.map((row) => (
            <section key={row.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{row.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {row.year} · {statusLabel(row.status)} · {formatWhen(row.windowOpen)} to {formatWhen(row.windowClose)}
                    {row.packageStatus ? ` · ${statusLabel(row.packageStatus)}` : ""}
                    {row.invitationSentAt ? " · invitation sent" : ""}
                    {row.mastersUpdatedAt ? " · masters updated" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {writable && row.status === "open" ? (
                    <button className={btnGhost} type="button" disabled={act.isPending} onClick={() => act.mutate({ path: `/api/crud/v1/awp/cycles/${row.id}/invite`, body: { mastersUpdated: true } })}>Send invitation</button>
                  ) : null}
                  {writable ? (
                    <button className={btnGhost} type="button" disabled={act.isPending} onClick={() => act.mutate({ path: `/api/crud/v1/awp/cycles/${row.id}/consolidate` })}>Consolidate</button>
                  ) : null}
                  {row.hasConsolidation ? <a className={btnGhost} href={`/api/crud/v1/awp/cycles/${row.id}/presentation`}>Presentation</a> : null}
                  {row.hasDisha ? <a className={btnGhost} href={`/api/crud/v1/awp/cycles/${row.id}/disha`}>DISHA file</a> : null}
                  {writable && row.status !== "closed" ? (
                    <button className={btnGhost} type="button" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "closed" })}>Close window</button>
                  ) : null}
                  {writable && row.status === "closed" ? (
                    <button className={btnGhost} type="button" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "open" })}>Reopen</button>
                  ) : null}
                </div>
              </div>
              {(packageTasks.data?.data || []).filter((task) => task.kind === "package" && task.cycleId === row.id).map((task) => (
                <PackageStep key={task.id} task={task} proposals={row.proposals} onDone={(path, body) => act.mutate({ path, body })} pending={act.isPending} />
              ))}
              <DepartmentPlan cycle={row} />
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PackageStep({
  task,
  proposals,
  onDone,
  pending,
}: {
  task: PackageTask;
  proposals: FiledProposal[];
  onDone: (path: string, body: unknown) => void;
  pending: boolean;
}) {
  const agenda = proposals.filter((row) => row.status === "tac_review");
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState(task.actions?.[0]?.action || "");
  const [items, setItems] = useState<Record<number, { decision: string; remarks: string }>>({});
  const path = `/api/crud/v1/awp/package-tasks/${task.id}/complete`;
  return (
    <form
      className="space-y-3 border-t border-slate-100 px-4 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        onDone(path, {
          action,
          remarks,
          items: agenda.map((row) => ({
            projectId: row.projectId,
            decision: items[row.projectId]?.decision || "finalised",
            remarks: items[row.projectId]?.remarks || "",
          })),
        });
      }}
    >
      <h3 className="text-sm font-semibold">{task.stageName || statusLabel(task.stageCode)}</h3>
      {task.stageCode === "tac_review" ? agenda.map((row) => (
        <div key={row.projectId} className="grid gap-2 md:grid-cols-[1fr_12rem]">
          <p className="text-sm">{row.proposalNumber} · {row.title}</p>
          <select
            className={field}
            value={items[row.projectId]?.decision || "finalised"}
            onChange={(event) => setItems({ ...items, [row.projectId]: { decision: event.target.value, remarks: items[row.projectId]?.remarks || "" } })}
          >
            <option value="finalised">Finalised</option>
            <option value="modified">Modified</option>
            <option value="removed">Removed</option>
          </select>
        </div>
      )) : null}
      <label className="block text-sm">Remarks
        <textarea className={`${field} mt-1 min-h-16`} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {(task.actions || []).map((item) => (
          <button key={item.action} className={item.action === action ? btn : btnGhost} type="button" onClick={() => setAction(item.action)}>{item.label}</button>
        ))}
        <button className={btn} type="submit" disabled={pending || !action}>{pending ? "Saving…" : "Record this step"}</button>
      </div>
    </form>
  );
}

function MastersPanel() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState("asset");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [coordinatorUserId, setCoordinatorUserId] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [tag, setTag] = useState("");
  const [message, setMessage] = useState("");
  const stakeholders = useQuery({
    queryKey: ["/api/crud/v1/awp/stakeholders"],
    queryFn: () => api<{ data: { id: number; kind: string; code: string; name: string; coordinatorName: string | null }[] }>("/api/crud/v1/awp/stakeholders"),
  });
  const coordinators = useQuery({
    queryKey: ["/api/crud/v1/awp/coordinators"],
    queryFn: () => api<{ data: { id: number; name: string; cpf: string }[] }>("/api/crud/v1/awp/coordinators"),
  });
  const routing = useQuery({
    queryKey: ["/api/crud/v1/awp/routing"],
    queryFn: () => api<{ data: { id: number; typeCode: string; typeName: string; departmentCode: string; departmentName: string; tag: string | null }[] }>("/api/crud/v1/awp/routing"),
  });
  const types = useQuery({
    queryKey: ["/api/crud/v1/admin/project-types"],
    queryFn: () => api<{ data: { id: number; code: string; name: string; active: boolean }[] }>("/api/crud/v1/admin/project-types"),
  });
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => api<{ data: { id: number; code: string; name: string; active: boolean }[] }>("/api/crud/v1/admin/departments"),
  });
  const save = useMutation({
    mutationFn: (input: { path: string; body: unknown }) => api(input.path, { method: "POST", body: JSON.stringify(input.body) }),
    onSuccess: async () => {
      setMessage("");
      setCode("");
      setName("");
      setTag("");
      await queryClient.invalidateQueries({ queryKey: ["/api/crud/v1/awp/stakeholders"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/crud/v1/awp/routing"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  return (
    <section className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Masters and routing</h2>
      {message ? <Banner>{message}</Banner> : null}
      <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save.mutate({ path: "/api/crud/v1/awp/stakeholders", body: { kind, code, name, coordinatorUserId: coordinatorUserId ? Number(coordinatorUserId) : null } }); }}>
        <label className="block text-sm">Kind
          <select className={`${field} mt-1`} value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="asset">Asset</option>
            <option value="plant">Plant</option>
            <option value="service">Service</option>
            <option value="institute">Institute</option>
          </select>
        </label>
        <label className="block text-sm">Coordinator
          <select className={`${field} mt-1`} value={coordinatorUserId} onChange={(event) => setCoordinatorUserId(event.target.value)}>
            <option value="">None</option>
            {(coordinators.data?.data || []).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.cpf}</option>)}
          </select>
        </label>
        <label className="block text-sm">Code
          <input className={`${field} mt-1`} value={code} onChange={(event) => setCode(event.target.value)} required />
        </label>
        <label className="block text-sm">Name
          <input className={`${field} mt-1`} value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <div className="md:col-span-2">
          <button className={btn} type="submit" disabled={save.isPending}>Add stakeholder</button>
        </div>
      </form>
      <ul className="space-y-1 text-sm text-slate-700">
        {(stakeholders.data?.data || []).map((row) => (
          <li key={row.id}>{statusLabel(row.kind)} · {row.code} · {row.name}{row.coordinatorName ? ` · ${row.coordinatorName}` : ""}</li>
        ))}
      </ul>
      <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); save.mutate({ path: "/api/crud/v1/awp/routing", body: { projectTypeId: Number(projectTypeId), departmentId: Number(departmentId), tag } }); }}>
        <label className="block text-sm">Study
          <select className={`${field} mt-1`} value={projectTypeId} onChange={(event) => setProjectTypeId(event.target.value)} required>
            <option value="">Select</option>
            {(types.data?.data || []).filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">Department
          <select className={`${field} mt-1`} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required>
            <option value="">Select</option>
            {(departments.data?.data || []).filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">Tag
          <input className={`${field} mt-1`} value={tag} onChange={(event) => setTag(event.target.value)} />
        </label>
        <div className="md:col-span-3">
          <button className={btnGhost} type="submit" disabled={save.isPending}>Add routing rule</button>
        </div>
      </form>
      <ul className="space-y-1 text-sm text-slate-700">
        {(routing.data?.data || []).map((row) => (
          <li key={row.id}>{row.typeCode} · {row.departmentCode}{row.tag ? ` · ${row.tag}` : ""}</li>
        ))}
      </ul>
    </section>
  );
}

function ListPage({
  title,
  detail,
  path,
  empty,
  columns,
  render,
}: {
  title: string;
  detail: string;
  path: string;
  empty: string;
  columns: string[];
  render: (row: Record<string, unknown>) => string[];
}) {
  const query = useQuery({
    queryKey: [path],
    queryFn: () => api<{ data: Record<string, unknown>[] }>(path),
  });
  return (
    <div>
      <PageHeader title={title} detail={detail} />
      {query.isError ? <Banner>{errorText(query.error)}</Banner> : null}
      {query.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : null}
      {query.data && query.data.data.length === 0 ? <Empty>{empty}</Empty> : null}
      {query.data && query.data.data.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}</tr>
            </thead>
            <tbody>
              {query.data.data.map((row, index) => (
                <tr key={String(row.id ?? index)} className="border-t border-slate-100">
                  {render(row).map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
