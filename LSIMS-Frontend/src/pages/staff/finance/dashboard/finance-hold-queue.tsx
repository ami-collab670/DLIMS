import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchJobOrders } from "@/features/jobs/api";
import { shortJobId } from "@/lib/laboratory";
import { clientJobReferenceLabel } from "@/lib/laboratory";
import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";

export function FinanceHoldQueue() {
  const { data, isLoading, isError } = useQuery({
    queryKey: dashboardKeys.financeHoldQueue,
    queryFn: () =>
      fetchJobOrders({ page: 1, page_size: 25, current_status: "finance_hold", is_cancelled: false }),
    staleTime: 60_000,
  });

  const jobs = data?.results ?? [];
  const preview = jobs.slice(0, 8);

  if (isLoading) {
    return (
      <section
        id="finance-hold-queue"
        className="rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (isError) return null;

  return (
    <section
      id="finance-hold-queue"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="finance-hold-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <AlertCircle className="size-4 text-amber-600" aria-hidden />
        <h3 id="finance-hold-heading" className="text-sm font-medium">
          Finance hold
        </h3>
        <span className="text-xs text-muted-foreground">
          {jobs.length} job{jobs.length === 1 ? "" : "s"} blocked
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Read-only list. Placing or clearing a hold requires reception desk action — see contact
        details on each job.
      </p>

      {!preview.length ? (
        <p className="text-sm text-muted-foreground">No jobs on finance hold.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 font-medium">Reference</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Hold reason</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((job) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      to={`/staff/finance?job=${job.id}`}
                      className="block text-xs font-medium text-primary hover:underline"
                    >
                      {clientJobReferenceLabel(job.description)}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">
                      {shortJobId(job.id)}
                    </span>
                  </td>
                  <td className="px-3 py-2">{job.client_name || job.client}</td>
                  <td className="max-w-[240px] truncate px-3 py-2 text-xs text-muted-foreground">
                    {job.status_reason?.trim() || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
