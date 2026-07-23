import { staffPath } from "@/lib/staff";
import { ClipboardList, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAwaitingFinanceJobs } from "@/features/laboratory/hooks";
import { JOB_PRIORITY_LABEL, JOB_STATUS_LABEL, shortJobId } from "@/lib/laboratory";

export function ReceptionistIntakeQueue() {
  const { data: jobs = [], isLoading, isError } = useAwaitingFinanceJobs({
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
      aria-labelledby="receptionist-finance-clearance-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ClipboardList className="size-4 text-primary" aria-hidden />
        <h3 id="receptionist-finance-clearance-heading" className="text-sm font-medium">
          Awaiting finance clearance
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
          No jobs are waiting on finance clearance.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 font-medium">Job</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Client</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((job) => (
                <tr key={job.id} className="border-b border-border/80">
                  <td className="px-3 py-2 font-mono text-xs">{shortJobId(job.id)}</td>
                  <td className="px-3 py-2">{JOB_STATUS_LABEL[job.current_status]}</td>
                  <td className="px-3 py-2 capitalize">
                    {JOB_PRIORITY_LABEL[job.priority]}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-muted-foreground">
                    {job.client_name || job.client}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {jobs.length > preview.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {preview.length} of {jobs.length}.
        </p>
      ) : null}
    </section>
  );
}
