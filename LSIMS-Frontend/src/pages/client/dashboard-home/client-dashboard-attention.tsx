import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchComplaints } from "@/features/laboratory/complaints-api";
import { JOB_STATUS_LABEL } from "@/lib/job-order-labels";
import {
  clientResultsJobUrl,
  complaintsNeedingFollowUp,
  extractClientReferenceLabel,
  fetchAllActiveJobs,
  fetchAllFinancialRecords,
  invoicesNeedingPayment,
  jobsNeedingAttention,
} from "@/pages/client/dashboard-home/client-dashboard-metrics";
import {
  ClientComplaintCategoryBadge,
  ClientComplaintStatusBadge,
} from "@/pages/client/complaints/client-complaint-badges";
import { truncateComplaintTitle } from "@/pages/client/complaints/constants";

import { clientDashboardKeys } from "./client-dashboard-api-keys";

export function ClientDashboardAttention() {
  const jobsQuery = useQuery({
    queryKey: clientDashboardKeys.allActiveJobs,
    queryFn: fetchAllActiveJobs,
    staleTime: 45_000,
  });

  const financeQuery = useQuery({
    queryKey: clientDashboardKeys.allFinancialRecords,
    queryFn: fetchAllFinancialRecords,
    staleTime: 45_000,
  });

  const complaintsQuery = useQuery({
    queryKey: clientDashboardKeys.attentionComplaints,
    queryFn: () => fetchComplaints({ page: 1, page_size: 20 }),
    staleTime: 45_000,
  });

  const loading =
    jobsQuery.isLoading || financeQuery.isLoading || complaintsQuery.isLoading;

  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const attentionJobs = jobsNeedingAttention(jobsQuery.data ?? []);
  const dueInvoices = invoicesNeedingPayment(financeQuery.data ?? []);
  const followUpComplaints = complaintsNeedingFollowUp(
    complaintsQuery.data?.results ?? [],
  );

  const hasItems =
    attentionJobs.length > 0 ||
    dueInvoices.length > 0 ||
    followUpComplaints.length > 0;

  if (!hasItems) {
    return (
      <section
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4 shadow-sm"
        aria-labelledby="attention-heading"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div>
            <h3 id="attention-heading" className="text-sm font-medium">
              You&apos;re all caught up!
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No jobs, invoices, or complaints need your attention right now.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4 shadow-sm"
      aria-labelledby="attention-heading"
    >
      <div className="flex flex-wrap items-start gap-2">
        <AlertCircle
          className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-500"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 id="attention-heading" className="text-sm font-medium">
            Attention needed
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Items that may require your action or follow-up.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {attentionJobs.length > 0 ? (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Jobs
            </h4>
            <ul className="mt-2 space-y-2">
              {attentionJobs.map((job) => (
                <li
                  key={job.id}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {extractClientReferenceLabel(job.description)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {JOB_STATUS_LABEL[job.current_status]}
                    </span>
                  </div>
                  {job.status_reason?.trim() ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.status_reason}
                    </p>
                  ) : job.current_status === "finance_hold" ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Finance hold — contact the laboratory or check your invoice.
                    </p>
                  ) : null}
                  <Link
                    to={clientResultsJobUrl(job.id)}
                    className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    View progress →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {dueInvoices.length > 0 ? (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Unpaid invoices
            </h4>
            <ul className="mt-2 space-y-2">
              {dueInvoices.map((inv) => (
                <li
                  key={inv.invoice_no}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs">{inv.invoice_no}</span>
                    <span className="capitalize text-xs text-muted-foreground">
                      {inv.payment_status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expected {inv.amount_expected} ETB · Paid {inv.amount_paid} ETB · Due{" "}
                    <span className="font-medium text-foreground">
                      {inv.amountDue.toFixed(2)} ETB
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {followUpComplaints.length > 0 ? (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Complaints
            </h4>
            <ul className="mt-2 space-y-2">
              {followUpComplaints.slice(0, 5).map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <p className="font-medium">{truncateComplaintTitle(c.description)}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <ClientComplaintCategoryBadge category={c.category} />
                    <ClientComplaintStatusBadge status={c.status} />
                  </div>
                  <Link
                    to={`/client/complaints?complaint=${c.id}`}
                    className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    View complaint →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
