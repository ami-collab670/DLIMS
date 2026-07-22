import { staffPath } from "@/lib/staff";
import { AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useJobOrders } from "@/features/jobs/hooks";
import { JOB_PRIORITY_LABEL, JOB_STATUS_LABEL, shortJobId } from "@/lib/laboratory";

export function StaffDashboardAttentionQueue() {
  const { data, isLoading, isError } = useJobOrders(
    { page: 1, current_status: "submitted", is_cancelled: false },
    { staleTime: 60_000 },
  );

  const rows = data?.results ?? [];
  const preview = rows.slice(0, 5);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (isError) {
    return null;
  }

  if (!data?.count) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-muted/10 p-4 shadow-sm">
        <h3 className="text-sm font-medium">Client submission queue</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No job orders are waiting in <strong>{JOB_STATUS_LABEL.submitted}</strong> status.
          New client requests will appear here for intake.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4 shadow-sm"
      aria-labelledby="attention-queue-heading"
    >
      <div className="flex flex-wrap items-start gap-2">
        <AlertCircle
          className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-500"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 id="attention-queue-heading" className="text-sm font-medium">
            Attention: {data.count} client submission{data.count === 1 ? "" : "s"} awaiting
            staff
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            These jobs are in <strong>{JOB_STATUS_LABEL.submitted}</strong> — review them in
            Laboratory (Jobs) and move them into reception when ready.
          </p>
        </div>
        <Link
          to={staffPath("laboratory")}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Go to jobs →
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2 font-medium">Job</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((job) => (
              <tr key={job.id} className="border-b border-border/80">
                <td className="px-3 py-2 font-mono text-xs">{shortJobId(job.id)}</td>
                <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">
                  {job.client}
                </td>
                <td className="px-3 py-2 capitalize">{JOB_PRIORITY_LABEL[job.priority]}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                  {new Date(job.created_at).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.count > preview.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {preview.length} of {data.count}. Open Laboratory for the full list and
          actions.
        </p>
      ) : null}
    </section>
  );
}
