import { useQuery } from "@tanstack/react-query";
import { api, errorText } from "../api";
import { Banner, PageHeader, statusLabel } from "../ui";

type Stage = {
  id: number;
  projectCategory: string;
  appliesTo: string;
  stageCode: string;
  stageName: string;
  stageOrder: number;
  assigneeRoleCode: string;
  departmentCode: string | null;
};

export function MatrixPage() {
  const query = useQuery({
    queryKey: ["matrix"],
    queryFn: () => api<{ data: Stage[] }>("/api/crud/v1/admin/matrix"),
  });
  const groups = new Map<string, Stage[]>();
  for (const stage of query.data?.data ?? []) {
    const key = `${stage.appliesTo} · ${statusLabel(stage.projectCategory)}`;
    groups.set(key, [...(groups.get(key) ?? []), stage]);
  }
  return (
    <div>
      <PageHeader title="Approval matrix" detail="Scheduled studies stop with the HOD. HOI, TAC, the Director, and publish then act on the consolidated AWP. In-year and short-term studies stay inside the department." />
      {query.isError ? <Banner>{errorText(query.error)}</Banner> : null}
      <div className="space-y-6">
        {[...groups.entries()].map(([title, stages]) => (
          <section key={title}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
            <ol className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {stages.map((stage) => (
                <li key={stage.id} className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3 first:border-t-0">
                  <span className="text-sm"><span className="mr-3 text-slate-400">{stage.stageOrder}</span>{stage.stageName}</span>
                  <span className="text-xs font-medium text-accent">{stage.assigneeRoleCode}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
