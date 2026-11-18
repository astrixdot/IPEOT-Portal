import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { api, errorText } from "../api";
import { can } from "../access";
import { useSession } from "../auth";
import { Banner, PageHeader, btn, btnGhost, field, formatWhen, statusLabel } from "../ui";
import { StudyGuidelines } from "./Guidelines";

type FormSchema = {
  kind?: string;
  modifications?: { code: string; name: string; sampleReport: string }[];
};

type Detail = {
  id: number;
  proposalNumber: string;
  title: string;
  status: string;
  projectCategory: string;
  typeName: string;
  departmentName: string;
  awpTitle?: string | null;
  sampleReport: string | null;
  inputs: string[];
  specimens: string[];
  equipment: string[];
  tests: string[];
  software: { name: string; use: string }[];
  formSchema: FormSchema | null;
  reviews?: { action: string | null; remarks: string | null; stageCode: string; completedAt: string | null; actorName: string | null; actorCpf: string | null }[];
  intake?: string;
  priority?: number | null;
  preferredQuarter?: string | null;
  finalQuarter?: string | null;
  scheduleDecision?: string | null;
  dependencyNote?: string | null;
  rejectionReason?: string | null;
  removalReason?: string | null;
  scopeNote?: string | null;
  jobTags?: string | null;
  shortTermOutcome?: string | null;
  shortTermEffort?: string | null;
  files?: { id: number; fileName: string; mime: string; sizeBytes: number }[];
  form: {
    asset?: string;
    platform?: string;
    answers?: Record<string, string>;
    specimens?: Record<string, string>;
    fields?: Record<string, string>;
    modifications?: { code: string; name: string; sampleReport: string; count: number; shared: Record<string, string>; items: Record<string, string>[] }[];
  };
};

type TaskAction = { action: string; label: string };
type InboxTask = {
  id: number;
  kind?: string;
  proposalId: number | null;
  stageCode: string;
  stageName: string | null;
  actions?: TaskAction[];
};

type Department = { id: number; code: string; name: string };

const forwardByStage: Record<string, { action: string; label: string }> = {
  hod_endorse: { action: "endorse", label: "Endorse" },
  hoi_authorize: { action: "authorize", label: "Authorize" },
  tac: { action: "authorize", label: "Authorize" },
  director: { action: "authorize", label: "Authorize" },
};

export function ProposalDetailPage() {
  const { id } = useParams();
  const session = useSession();
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState("");
  const [chosen, setChosen] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [decision, setDecision] = useState("scheduled");
  const [dependency, setDependency] = useState("");
  const [tags, setTags] = useState("");
  const [outcome, setOutcome] = useState("");
  const [effort, setEffort] = useState("");
  const [reroute, setReroute] = useState("in_year");
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"proposal" | "guidelines">("proposal");
  const query = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => api<{ data: Detail }>(`/api/crud/v1/proposals/${id}`),
  });
  const tasks = useQuery({
    queryKey: ["tasks"],
    enabled: can(session.data?.user, "workflow.act"),
    queryFn: () => api<{ data: InboxTask[] }>("/api/crud/v1/tasks/mine"),
  });
  const submit = useMutation({
    mutationFn: () => api(`/api/crud/v1/proposals/${id}/submit`, { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/crud/v1/awp/cycles"] });
    },
  });
  const review = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/api/crud/v1/tasks/${task?.id}/complete`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
    onSuccess: async () => {
      setRemarks("");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["guidelines"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/crud/v1/awp/cycles"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  const data = query.data?.data;
  const task = tasks.data?.data.find((item) => item.kind !== "package" && item.proposalId === data?.id);
  const phaseActions = task?.actions || [];
  const actions = phaseActions.length > 0
    ? phaseActions
    : [
      forwardByStage[task?.stageCode || ""] || { action: "accept", label: "Accept" },
      { action: "modify", label: "Send back" },
      { action: "reject", label: "Reject" },
    ];
  useEffect(() => {
    if (actions[0] && !actions.some((item) => item.action === chosen)) setChosen(actions[0].action);
  }, [task?.id, task?.stageCode]);
  const departments = useQuery({
    queryKey: ["departments"],
    enabled: task?.stageCode === "pcc_route" && can(session.data?.user, "admin.masters.read"),
    queryFn: () => api<{ data: Department[] }>("/api/crud/v1/admin/departments"),
  });
  const canResubmit = data?.status === "draft" || data?.status === "scope_modification";
  return (
    <div>
      <Link className="text-sm text-ink hover:text-accent" to="/proposals">All proposals</Link>
      {query.isError ? <Banner>{errorText(query.error)}</Banner> : null}
      {submit.isError ? <Banner>{errorText(submit.error)}</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}
      {data ? (
        <>
          <PageHeader title={data.title} detail={`${data.proposalNumber} · ${data.departmentName} · ${data.typeName}`} />
          <p className="mb-4 text-sm text-slate-600">{statusLabel(data.projectCategory)} · {statusLabel(data.status)}{data.intake === "in_year" ? " · in-year" : ""}{data.priority ? ` · priority ${data.priority}` : ""}{data.preferredQuarter ? ` · preferred ${data.preferredQuarter}` : ""}{data.finalQuarter ? ` · ${data.finalQuarter}` : ""}{data.awpTitle ? ` · ${data.awpTitle}` : ""}{data.sampleReport ? ` · Sample ${data.sampleReport}` : ""}{data.form.asset ? ` · ${data.form.asset}` : ""}</p>
          {data.scheduleDecision || data.dependencyNote || data.scopeNote || data.jobTags || data.rejectionReason || data.removalReason || data.shortTermOutcome ? (
            <section className="mb-4 space-y-1 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
              {data.scheduleDecision ? <p>Schedule: {statusLabel(data.scheduleDecision)}</p> : null}
              {data.dependencyNote ? <p>Dependency: {data.dependencyNote}</p> : null}
              {data.scopeNote ? <p>Scope note: {data.scopeNote}</p> : null}
              {data.jobTags ? <p>Tags: {data.jobTags}</p> : null}
              {data.rejectionReason ? <p>Rejection: {data.rejectionReason}</p> : null}
              {data.removalReason ? <p>Removed: {data.removalReason}</p> : null}
              {data.shortTermOutcome ? <p>Outcome: {data.shortTermOutcome}</p> : null}
              {data.shortTermEffort ? <p>Effort: {data.shortTermEffort}</p> : null}
            </section>
          ) : null}
          {(data.files || []).length > 0 ? (
            <ul className="mb-4 space-y-1 text-sm">
              {data.files?.map((file) => (
                <li key={file.id}>
                  <button className="text-ink underline" type="button" onClick={() => void downloadFile(data.id, file)}>{file.fileName}</button>
                  <span className="text-slate-500"> · {Math.max(1, Math.round(file.sizeBytes / 1024))} KB</span>
                </li>
              ))}
            </ul>
          ) : null}
          {data.form.platform ? <p className="mb-4 text-sm">Platform {data.form.platform}</p> : null}
          <div className="mb-6 flex gap-2">
            <button type="button" className={tab === "proposal" ? btn : btnGhost} onClick={() => setTab("proposal")}>Proposal</button>
            <button type="button" className={tab === "guidelines" ? btn : btnGhost} onClick={() => setTab("guidelines")}>General guidelines</button>
          </div>
          {tab === "guidelines" ? <StudyGuidelines category={data.projectCategory} proposalId={data.id} /> : null}
          {tab === "proposal" ? <>
          {canResubmit && can(session.data?.user, "proposals.submit") ? (
            <button className={`${btn} mb-6`} type="button" disabled={submit.isPending} onClick={() => submit.mutate()}>
              {submit.isPending ? "Submitting…" : "Submit for review"}
            </button>
          ) : null}
          {task ? (
            <form
              className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4"
              onSubmit={(event) => {
                event.preventDefault();
                review.mutate({
                  action: chosen,
                  remarks,
                  quarter,
                  decision,
                  dependency,
                  tags,
                  outcome,
                  effort,
                  reroute,
                  departmentIds,
                });
              }}
            >
              <h2 className="font-semibold">{task.stageName || "Review"}</h2>
              {task.stageCode === "pcc_route" && (departments.data?.data.length || 0) > 0 ? (
                <fieldset className="space-y-1 text-sm">
                  <legend>Departments</legend>
                  {departments.data?.data.filter((item) => item).map((item) => (
                    <label key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={departmentIds.includes(item.id)}
                        onChange={(event) => setDepartmentIds(event.target.checked ? [...departmentIds, item.id] : departmentIds.filter((id) => id !== item.id))}
                      />
                      {item.code} · {item.name}
                    </label>
                  ))}
                  <p className="text-xs text-slate-500">Leave this blank to use the routing matrix for the study.</p>
                </fieldset>
              ) : null}
              {chosen === "reroute" ? (
                <label className="block text-sm">Where should this go
                  <select className={`${field} mt-1`} value={reroute} onChange={(event) => setReroute(event.target.value)}>
                    <option value="in_year">In-year request</option>
                    <option value="next_awp">Hold for the next AWP</option>
                  </select>
                </label>
              ) : null}
              {task.stageCode === "incharge_review" ? (
                <>
                  <label className="block text-sm">Decision
                    <select className={`${field} mt-1`} value={decision} onChange={(event) => setDecision(event.target.value)}>
                      <option value="scheduled">Scheduled, with a quarter</option>
                      <option value="unscheduled">Unscheduled, no timeline</option>
                    </select>
                  </label>
                  {decision === "scheduled" ? (
                    <label className="block text-sm">Quarter
                      <select className={`${field} mt-1`} value={quarter} onChange={(event) => setQuarter(event.target.value)}>
                        {["Q1", "Q2", "Q3", "Q4"].map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                  ) : (
                    <label className="block text-sm">Dependency
                      <input className={`${field} mt-1`} value={dependency} onChange={(event) => setDependency(event.target.value)} />
                    </label>
                  )}
                </>
              ) : null}
              {task.stageCode === "dept_review" && chosen === "accept" ? (
                <label className="block text-sm">Tags
                  <input className={`${field} mt-1`} value={tags} onChange={(event) => setTags(event.target.value)} />
                </label>
              ) : null}
              {task.stageCode === "short_term_close" ? (
                <>
                  <label className="block text-sm">Outcome
                    <textarea className={`${field} mt-1 min-h-20`} value={outcome} onChange={(event) => setOutcome(event.target.value)} />
                  </label>
                  <label className="block text-sm">Effort
                    <input className={`${field} mt-1`} value={effort} onChange={(event) => setEffort(event.target.value)} />
                  </label>
                </>
              ) : null}
              <label className="block text-sm">Remarks
                <textarea className={`${field} mt-1 min-h-20`} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
              </label>
              <div className="flex flex-wrap gap-2">
                {actions.map((item) => (
                  <button
                    key={item.action}
                    className={item.action === chosen ? btn : btnGhost}
                    type="button"
                    disabled={review.isPending}
                    onClick={() => setChosen(item.action)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button className={btn} type="submit" disabled={review.isPending || !chosen}>
                {review.isPending ? "Saving…" : "Record this step"}
              </button>
            </form>
          ) : null}
          {(data.reviews || []).length > 0 ? (
            <section className="mb-6 space-y-2">
              {data.reviews?.map((item, index) => (
                <p key={index} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {[item.actorName, item.actorCpf, statusLabel(item.action || item.stageCode), formatWhen(item.completedAt), item.remarks].filter(Boolean).join(" · ")}
                </p>
              ))}
            </section>
          ) : null}
          <div className="space-y-4">
            {(data.inputs || []).map((input, index) => (
              <section key={input} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <h2 className="font-medium">{input}</h2>
                <p className="mt-2 whitespace-pre-wrap text-slate-700">{data.form.answers?.[String(index)] || "—"}</p>
              </section>
            ))}
            {(data.specimens || []).map((specimen, index) => (
              <section key={specimen} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <h2 className="font-medium">{specimen}</h2>
                <p className="mt-2 text-slate-700">{data.form.specimens?.[String(index)] || "—"}</p>
              </section>
            ))}
            {Object.entries(data.form.fields || {}).map(([key, value]) => (
              <section key={key} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <h2 className="font-medium">{key}</h2>
                <p className="mt-2 text-slate-700">{value || "—"}</p>
              </section>
            ))}
            {(data.form.modifications || []).map((modification) => (
              <section key={modification.code} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <h2 className="font-medium">{modification.name} · sample {modification.sampleReport}</h2>
                <p className="mt-2 text-slate-600">{Object.entries(modification.shared).map(([key, value]) => `${key}: ${value || "—"}`).join(" · ")}</p>
                {modification.items.map((item, index) => (
                  <p key={index} className="mt-1 text-slate-700">Item {index + 1}: {Object.entries(item).map(([key, value]) => `${key} ${value || "—"}`).join(", ")}</p>
                ))}
              </section>
            ))}
          </div>
          </> : null}
        </>
      ) : null}
    </div>
  );
}

async function downloadFile(proposalId: number, file: { id: number; fileName: string }) {
  const response = await fetch(`/api/crud/v1/proposals/${proposalId}/files/${file.id}`, { credentials: "include" });
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.fileName;
  link.click();
  URL.revokeObjectURL(url);
}
