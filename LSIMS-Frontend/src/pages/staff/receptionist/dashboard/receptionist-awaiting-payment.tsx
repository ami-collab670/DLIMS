import { useQuery } from "@tanstack/react-query";
import { Landmark, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchFinancialRecords } from "@/features/laboratory/financial-records-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { JOB_STATUS_LABEL, shortJobId } from "@/lib/job-order-labels";
import type { JobOrder } from "@/types/laboratory";

import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { fetchAwaitingFinanceJobs } from "@/pages/staff/receptionist/shared/fetch-awaiting-finance-jobs";

function needsPaymentAttention(job: JobOrder, hasInvoice: boolean): boolean {
  if (job.current_status === "pending_finance" || job.current_status === "finance_hold") {
    return true;
  }
  return job.current_status === "submitted" && !hasInvoice;
}

export function ReceptionistAwaitingPayment() {
  const jobsQuery = useQuery({
    queryKey: dashboardKeys.receptionistAwaitingPayment,
    queryFn: fetchAwaitingFinanceJobs,
    staleTime: 60_000,
  });

  const invoicesQuery = useQuery({
    queryKey: laboratoryQueryKeys.financialRecords(),
    queryFn: () => fetchFinancialRecords({ page: 1 }),
    staleTime: 60_000,
  });

  const invoiceByJob = new Map<string, boolean>();
  for (const r of invoicesQuery.data?.results ?? []) {
    invoiceByJob.set(r.job, true);
  }

  const jobs = (jobsQuery.data ?? []).filter((job) =>
    needsPaymentAttention(job, invoiceByJob.has(job.id)),
  );
  const preview = jobs.slice(0, 5);
  const isLoading = jobsQuery.isLoading || invoicesQuery.isLoading;

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (jobsQuery.isError) return null;

  return (
    <section
      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4 shadow-sm"
      aria-labelledby="receptionist-payment-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Landmark className="size-4 text-amber-600" aria-hidden />
        <h3 id="receptionist-payment-heading" className="text-sm font-medium">
          Awaiting payment
        </h3>
        <span className="text-xs text-muted-foreground">
          {jobs.length} job{jobs.length === 1 ? "" : "s"}
        </span>
        <Link
          to="/staff/finance"
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Finance status →
        </Link>
      </div>

      {!jobs.length ? (
        <p className="text-sm text-muted-foreground">
          All intake jobs have finance records or are cleared.
        </p>
      ) : (
        <ul className="space-y-2">
          {preview.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <div>
                <span className="font-mono text-xs">{shortJobId(job.id)}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span>{job.client_name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {JOB_STATUS_LABEL[job.current_status]}
                </span>
              </div>
              <Link
                to={`/staff/finance?job=${job.id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Check payment status →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
