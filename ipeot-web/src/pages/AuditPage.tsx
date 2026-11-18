import { useQuery } from "@tanstack/react-query";
import { api, errorText } from "../api";
import { Banner, PageHeader, formatWhen } from "../ui";

type AuditRow = {
  id: number;
  entity: string;
  entityId: string | null;
  action: string;
  actorName: string | null;
  payload: unknown;
  createdAt: string;
};

export function AuditPage() {
  const query = useQuery({
    queryKey: ["audit"],
    queryFn: () => api<{ data: AuditRow[]; total: number }>("/api/crud/v1/admin/audit?limit=50"),
  });
  return (
    <div>
      <PageHeader title="Audit log" detail="Sign-in and master-data changes are appended here and cannot be edited." />
      {query.isError ? <Banner>{errorText(query.error)}</Banner> : null}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {["When", "Actor", "Action", "Record"].map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {query.data?.data.map((row) => (
              <tr key={`${row.id}-${row.createdAt}`} className="border-t border-slate-100">
                <td className="px-3 py-2 whitespace-nowrap">{formatWhen(row.createdAt)}</td>
                <td className="px-3 py-2">{row.actorName || "—"}</td>
                <td className="px-3 py-2">{row.action}</td>
                <td className="px-3 py-2">{row.entity} {row.entityId || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
