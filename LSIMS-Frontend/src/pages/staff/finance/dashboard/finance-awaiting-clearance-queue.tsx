import { staffPath } from "@/lib/staff";
import { FilePlus2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useFinanceAwaitingClearanceQueue } from "@/features/laboratory/hooks";
import { JOB_PRIORITY_LABEL, shortJobId } from "@/lib/laboratory";
import { formatMoney } from "@/lib/formatting";
import { clientJobReferenceLabel } from "@/lib/laboratory";
import { parseJobBillingSummary } from "@/lib/laboratory/jobs/billing";

export function FinanceAwaitingClearanceQueue() {
  const { data, isLoading, isError } = useFinanceAwaitingClearanceQueue();

  const preview = (data ?? []).slice(0, 8);

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
      aria-labelledby="finance-awaiting-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilePlus2 className="size-4 text-primary" aria-hidden />
        <h3 id="finance-awaiting-heading" className="text-sm font-medium">
          Awaiting clearance
        </h3>
        <span className="text-xs text-muted-foreground">
          {(data ?? []).length} job{(data ?? []).length === 1 ? "" : "s"} need first invoice
        </span>
        <Link
          to={staffPath("finance")}
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Open invoices →
        </Link>
      </div>

      {!preview.length ? (
        <p className="text-sm text-muted-foreground">No jobs waiting for a first invoice.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 font-medium">Reference</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Scope</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {preview.map((job) => {
                const billing = parseJobBillingSummary(job.description);
                return (
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
                    <td className="px-3 py-2 text-xs">
                      {JOB_PRIORITY_LABEL[job.priority] ?? job.priority}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {billing.lines.length > 0 ? (
                        <>
                          {billing.lines.length} test{billing.lines.length === 1 ? "" : "s"}
                          {billing.indicativeTotal != null ? (
                            <span className="block tabular-nums">
                              {formatMoney(billing.indicativeTotal)}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/staff/finance?job=${job.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Create invoice
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
