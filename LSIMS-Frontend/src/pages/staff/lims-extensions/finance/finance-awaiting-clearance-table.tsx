import { Loader2 } from "lucide-react";
import { Fragment } from "react";

import { JobRoleHoldBadge } from "@/components/jobs/job-role-hold-badge";
import { Button } from "@/components/ui/button";
import { JOB_PRIORITY_LABEL, JOB_STATUS_LABEL, shortJobId } from "@/lib/laboratory";
import { clientJobReferenceLabel } from "@/lib/laboratory";
import { formatPaymentStatusLabel } from "@/lib/laboratory/labels/payment-labels";
import { hasClientSearchQuery } from "@/lib/staff/receptionist/client-search";
import { FinanceJobBillingBreakdown } from "@/pages/staff/finance/shared/finance-job-billing-breakdown";
import { MarkPaidButton } from "@/pages/staff/finance/shared/finance-invoice-actions";
import type { RoleRecord } from "@/types/account-admin";
import type { FinancialRecord, JobOrder } from "@/types/laboratory";

type FinanceAwaitingClearanceTableProps = {
  readOnlyFinance: boolean;
  showFinanceTables: boolean;
  debouncedFinanceSearch: string;
  awaitingLoading: boolean;
  filteredAwaiting: JobOrder[];
  invoiceByJob: Map<string, FinancialRecord>;
  expandedAwaitingIds: Set<string>;
  onToggleAwaitingExpand: (jobId: string) => void;
  roles: RoleRecord[];
  onOpenJob?: (jobId: string) => void;
  onOpenCreateForJob: (job: JobOrder) => void;
  onOpenEditForJob: (jobId: string) => void;
};

export function FinanceAwaitingClearanceTable({
  readOnlyFinance,
  showFinanceTables,
  debouncedFinanceSearch,
  awaitingLoading,
  filteredAwaiting,
  invoiceByJob,
  expandedAwaitingIds,
  onToggleAwaitingExpand,
  roles,
  onOpenJob,
  onOpenCreateForJob,
  onOpenEditForJob,
}: FinanceAwaitingClearanceTableProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Awaiting finance clearance</h3>
      <p className="text-xs text-muted-foreground">
        {readOnlyFinance
          ? "Jobs waiting on Finance to create an invoice or mark payment. Coordinate with the finance desk — you cannot edit invoices from this role."
          : "Create an invoice for each job, then mark it paid (or approve a discount waiver) to release the job to laboratory intake."}
      </p>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {awaitingLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !showFinanceTables ? (
          <p className="p-6 text-sm text-muted-foreground">
            Search by client name, phone, or email to view finance clearance jobs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium w-8" />
                  <th className="px-4 py-2 font-medium">Reference</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 font-medium">Workflow</th>
                  <th className="px-4 py-2 font-medium">Invoice / payment</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredAwaiting.map((j) => {
                  const invoice = invoiceByJob.get(j.id);
                  const expanded = expandedAwaitingIds.has(j.id);
                  const refLabel = clientJobReferenceLabel(j.description);
                  return (
                    <Fragment key={j.id}>
                      <tr className="border-b">
                        <td className="px-2 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={expanded ? "Collapse billing" : "Expand billing"}
                            onClick={() => onToggleAwaitingExpand(j.id)}
                          >
                            {expanded ? "−" : "+"}
                          </Button>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{refLabel}</span>
                            {onOpenJob && !readOnlyFinance ? (
                              <button
                                type="button"
                                className="w-fit font-mono text-xs text-primary hover:underline"
                                onClick={() => onOpenJob(j.id)}
                              >
                                {shortJobId(j.id)}
                              </button>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground">
                                {shortJobId(j.id)}
                              </span>
                            )}
                            <JobRoleHoldBadge blockedByRole={j.blocked_by_role} roles={roles} />
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="block">{j.client_name || j.client}</span>
                          <span className="text-xs text-muted-foreground">{j.client}</span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {JOB_PRIORITY_LABEL[j.priority] ?? j.priority}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {JOB_STATUS_LABEL[j.current_status]}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {invoice ? (
                            <>
                              <span className="block font-mono">{invoice.invoice_no}</span>
                              <span>{formatPaymentStatusLabel(invoice.payment_status)}</span>
                            </>
                          ) : (
                            "No invoice yet"
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {readOnlyFinance ? (
                            <span className="text-xs text-muted-foreground">
                              {invoice
                                ? formatPaymentStatusLabel(invoice.payment_status)
                                : "Awaiting invoice"}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {invoice ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onOpenEditForJob(j.id)}
                                  >
                                    Edit invoice
                                  </Button>
                                  {invoice.payment_status !== "paid" &&
                                  !invoice.waiver_approved_at ? (
                                    <MarkPaidButton record={invoice} />
                                  ) : null}
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => onOpenCreateForJob(j)}
                                >
                                  Create invoice
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                      {expanded ? (
                        <tr key={`${j.id}-billing`} className="border-b bg-muted/10">
                          <td colSpan={7} className="px-4 py-3">
                            <FinanceJobBillingBreakdown
                              job={j}
                              invoice={invoice}
                              collapsible={false}
                              showMeta={false}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {showFinanceTables && !awaitingLoading && filteredAwaiting.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            {readOnlyFinance && hasClientSearchQuery(debouncedFinanceSearch)
              ? "No finance clearance jobs match your search."
              : "No jobs are waiting for finance clearance."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
