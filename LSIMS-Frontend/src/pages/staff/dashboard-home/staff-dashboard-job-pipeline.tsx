import { staffPath } from "@/lib/staff";
import { useQueries } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchJobOrders } from "@/features/jobs/api";
import { JOB_STATUS_LABEL } from "@/lib/laboratory";
import type { JobOrderStatus } from "@/types/laboratory";

import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";

const PIPELINE_STATUSES: JobOrderStatus[] = [
  "pending_finance",
  "submitted",
  "received",
  "in_prep",
  "in_analysis",
  "qc",
  "finance_hold",
  "completed",
];

export function StaffDashboardJobPipeline() {
  const queries = useQueries({
    queries: PIPELINE_STATUSES.map((current_status) => ({
      queryKey: dashboardKeys.jobCount(current_status),
      queryFn: () =>
        fetchJobOrders({ page: 1, current_status, is_cancelled: false }),
      staleTime: 60_000,
    })),
  });

  const loading = queries.some((q) => q.isLoading);
  const anyError = queries.some((q) => q.isError);

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="job-pipeline-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="job-pipeline-heading" className="text-sm font-medium">
            Job order pipeline
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Active (non-cancelled) counts by workflow status from{" "}
            <code className="rounded bg-muted px-1">GET /api/laboratory/jobs/</code>.
          </p>
        </div>
        <Link
          to={staffPath("laboratory")}
          className="text-xs font-medium text-primary hover:underline"
        >
          Open laboratory →
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : anyError ? (
        <p className="mt-4 text-sm text-destructive">
          Could not load job metrics. Try again from the Laboratory page.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {PIPELINE_STATUSES.map((status, i) => {
            const count = queries[i].data?.count ?? 0;
            const needsAttention =
              (status === "pending_finance" || status === "submitted") &&
              count > 0;
            return (
              <li
                key={status}
                className={`rounded-lg border px-3 py-2 text-center ${
                  needsAttention
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border bg-muted/20"
                }`}
              >
                <p className="text-xs text-muted-foreground">{JOB_STATUS_LABEL[status]}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{count}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
