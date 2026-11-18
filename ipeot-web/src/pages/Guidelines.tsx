import { useQuery } from "@tanstack/react-query";
import { api, errorText } from "../api";
import { Banner } from "../ui";

type Stage = {
  stageOrder: number;
  stageName: string;
  stageCode: string;
  targetDays: number | null;
  taskStatus: string | null;
  doneInDays: number | null;
  onTime: boolean | null;
};

function dayLabel(days: number | null) {
  if (days == null) return "—";
  return days === 1 ? "1 day" : `${days} days`;
}

export function StudyGuidelines({ category, proposalId }: { category: string; proposalId?: number }) {
  const query = useQuery({
    queryKey: ["guidelines", category, proposalId ?? "new"],
    queryFn: () => {
      const params = new URLSearchParams({ category });
      if (proposalId) params.set("proposalId", String(proposalId));
      return api<{ data: Stage[] }>(`/api/crud/v1/guidelines?${params}`);
    },
  });
  const stages = query.data?.data || [];
  return (
    <section>
      <h2 className="text-lg font-semibold">General guidelines</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Done in is filled after that stage acts, counted from the moment the previous stage handed the proposal over. Less than a day is 0 days. Green means the action was inside Max days allowed. The stage holding the proposal stays blank until that person acts, and turns red only if the allowance runs out first.
      </p>
      {query.isError ? <Banner>{errorText(query.error)}</Banner> : null}
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {["Stage", "Max days allowed", "Done in", "Within time"].map((column) => (
                <th key={column} className="px-3 py-2 font-medium">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => (
              <tr key={stage.stageCode} className="border-t border-slate-100">
                <td className="px-3 py-2"><span className="mr-3 text-slate-400">{stage.stageOrder}</span>{stage.stageName}</td>
                <td className="px-3 py-2">{dayLabel(stage.targetDays)}</td>
                <td className="px-3 py-2">{dayLabel(stage.doneInDays)}</td>
                <td className="px-3 py-2"><TimeLight onTime={stage.onTime} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TimeLight({ onTime }: { onTime: boolean | null }) {
  if (onTime == null) return <span className="text-slate-300">—</span>;
  const onTimeNow = onTime;
  return (
    <span
      className={`inline-block h-3.5 w-3.5 rounded-full ${onTimeNow ? "bg-green-500" : "bg-red-500"}`}
      role="img"
      aria-label={onTimeNow ? "Within the allowed days" : "Longer than the allowed days"}
    />
  );
}
