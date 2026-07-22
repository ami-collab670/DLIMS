import { staffPath } from "@/lib/staff";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { JOB_PRIORITY_LABEL, JOB_STATUS_LABEL, shortJobId } from "@/lib/laboratory";

import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";
import { fetchAwaitingFinanceJobs } from "@/features/laboratory/lib/fetch-awaiting-finance-jobs";

export function ReceptionistIntakeQueue() {
  const { data: jobs = [], isLoading, isError } = useQuery({
    queryKey: dashboardKeys.receptionistIntakeQueue,
    queryFn: fetchAwaitingFinanceJobs,
    staleTime: 60_000,
  });

  const preview = jobs.slice(0, 5);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (isError) return null;

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="receptionist-intake-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ClipboardList className="size-4 text-primary" aria-hidden />
        <h3 id="receptionist-intake-heading" className="text-sm font-medium">
          Intake queue
        </h3>
        <span className="text-xs text-muted-foreground">
          {jobs.length} job{jobs.length === 1 ? "" : "s"} awaiting finance
        </span>
        <Link
          to={staffPath("laboratory")}
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Sample intake →
        </Link>
      </div>

      {!jobs.length ? (
        <p className="text-sm text-muted-foreground">
          No jobs in{" "}
          <strong>{JOB_STATUS_LABEL.pending_finance}</strong> status right now.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 font-medium">Job</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((job) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link
                      to={`/staff/laboratory?tab=jobs&job=${job.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {shortJobId(job.id)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{job.client_name}</td>
                  <td className="px-3 py-2 text-xs">
                    {JOB_PRIORITY_LABEL[job.priority]}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {JOB_STATUS_LABEL[job.current_status]}
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
