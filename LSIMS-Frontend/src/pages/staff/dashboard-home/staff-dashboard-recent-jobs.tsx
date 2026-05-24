import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchJobOrders } from "@/features/jobs/api";
import {
  JOB_PRIORITY_LABEL,
  JOB_STATUS_LABEL,
  shortJobId,
} from "@/lib/job-order-labels";

import { dashboardKeys } from "./dashboard-api-keys";

const PREVIEW_LIMIT = 6;

export function StaffDashboardRecentJobs() {
  const { data, isLoading, isError } = useQuery({
    queryKey: dashboardKeys.recentJobs,
    queryFn: () => fetchJobOrders({ page: 1 }),
    staleTime: 45_000,
  });

  const rows = [...(data?.results ?? [])].slice(0, PREVIEW_LIMIT);

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="recent-jobs-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          <div>
            <h3 id="recent-jobs-heading" className="text-sm font-medium">
              Recent job activity
            </h3>
            <p className="text-xs text-muted-foreground">
              Newest job orders (first page), including cancelled items for audit context.
            </p>
          </div>
        </div>
        <Link
          to="/staff/laboratory"
          className="text-xs font-medium text-primary hover:underline"
        >
          Laboratory →
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="mt-4 text-sm text-destructive">Could not load recent jobs.</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No job orders yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 font-medium">Job</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Samples</th>
                <th className="px-3 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((job) => (
                <tr key={job.id} className="border-b border-border/80">
                  <td className="px-3 py-2 font-mono text-xs">{shortJobId(job.id)}</td>
                  <td className="px-3 py-2">
                    <span>{JOB_STATUS_LABEL[job.current_status]}</span>
                    {job.is_cancelled ? (
                      <span className="ml-2 text-xs text-destructive">Cancelled</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {JOB_PRIORITY_LABEL[job.priority]}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-muted-foreground">
                    {job.client}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{job.sample_count}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                    {new Date(job.updated_at).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
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
