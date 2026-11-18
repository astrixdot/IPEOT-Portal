import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, errorText } from "../api";
import { can } from "../access";
import { useSession } from "../auth";
import { Banner, Empty, PageHeader, btn, statusLabel } from "../ui";

type Row = {
  id: number;
  proposalNumber: string;
  title: string;
  status: string;
  projectCategory: string;
  typeName: string;
  departmentCode: string;
  submittedAt: string | null;
};

export function ProposalsPage() {
  const session = useSession();
  const query = useQuery({
    queryKey: ["proposals"],
    queryFn: () => api<{ data: Row[] }>("/api/crud/v1/proposals"),
  });
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader title="Proposals" detail="Each study from the department catalogue has its own inputs, specimens, and, for structures, its modification sheet." />
        {can(session.data?.user, "proposals.write") ? <Link className={btn} to="/proposals/new">New proposal</Link> : null}
      </div>
      {query.isError ? <Banner>{errorText(query.error)}</Banner> : null}
      {query.data && query.data.data.length === 0 ? <Empty>No proposals yet.</Empty> : null}
      {query.data && query.data.data.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Number", "Title", "Study", "Category", "Status"].map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}</tr>
            </thead>
            <tbody>
              {query.data.data.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2"><Link className="font-medium text-ink hover:text-accent" to={`/proposals/${row.id}`}>{row.proposalNumber}</Link></td>
                  <td className="px-3 py-2">{row.title}</td>
                  <td className="px-3 py-2">{row.departmentCode} · {row.typeName}</td>
                  <td className="px-3 py-2">{statusLabel(row.projectCategory)}</td>
                  <td className="px-3 py-2">{statusLabel(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
