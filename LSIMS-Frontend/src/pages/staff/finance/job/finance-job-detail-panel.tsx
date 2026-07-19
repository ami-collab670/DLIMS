import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { JobRoleHoldBadge } from "@/components/jobs/job-role-hold-badge";
import { Button } from "@/components/ui/button";
import { fetchRoles } from "@/features/accounts/roles-api";
import { fetchFinancialRecords } from "@/features/laboratory/financial-records-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { JOB_PRIORITY_LABEL, JOB_STATUS_LABEL, shortJobId } from "@/lib/job-order-labels";
import { clientJobReferenceLabel } from "@/lib/sample-reference-display";
import type { FinancialRecord, JobOrder, PaymentStatus } from "@/types/laboratory";

import { FinanceContactStrip } from "@/pages/staff/finance/dashboard/finance-contact-strip";
import { FinanceJobBillingBreakdown } from "@/pages/staff/finance/shared/finance-job-billing-breakdown";
import {
  formatPaidAt,
  formatPaymentStatusLabel,
} from "@/pages/staff/finance/shared/finance-payment-labels";
import { suggestedInvoiceAmount, parseJobBillingSummary } from "@/pages/staff/finance/shared/parse-job-billing";

import {
  CreateInvoiceForm,
  EditInvoiceForm,
} from "../shared/finance-invoice-actions";

type Props = {
  job: JobOrder;
  onClose: () => void;
  onUpdated: () => void;
};

export function FinanceJobDetailPanel({ job, onClose, onUpdated }: Props) {
  const queryClient = useQueryClient();
  const [createExpected, setCreateExpected] = useState("");
  const [editing, setEditing] = useState(false);
  const [editExpected, setEditExpected] = useState("");
  const [editPaid, setEditPaid] = useState("");
  const [editStatus, setEditStatus] = useState<PaymentStatus>("pending");

  const billingSummary = useMemo(
    () => parseJobBillingSummary(job.description),
    [job.description],
  );
  const refLabel = clientJobReferenceLabel(job.description);
  const suggestedAmount = suggestedInvoiceAmount(billingSummary);

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
    staleTime: 60_000,
  });

  const {
    data: financialData,
    isLoading: invoiceLoading,
    refetch: refetchInvoice,
  } = useQuery({
    queryKey: laboratoryQueryKeys.financialRecords({ job: job.id }),
    queryFn: () => fetchFinancialRecords({ job: job.id, page: 1 }),
    staleTime: 0,
  });

  const record: FinancialRecord | null = financialData?.results[0] ?? null;

  useEffect(() => {
    if (record) {
      setEditExpected(record.amount_expected);
      setEditPaid(record.amount_paid);
      setEditStatus(record.payment_status);
    } else if (suggestedAmount) {
      setCreateExpected(suggestedAmount);
    }
  }, [record, suggestedAmount]);

  const handleSuccess = () => {
    void refetchInvoice();
    onUpdated();
    setEditing(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Job payment</p>
          <p className="text-sm font-semibold">{refLabel}</p>
          <p className="font-mono text-xs text-muted-foreground">{shortJobId(job.id)}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <FinanceContactStrip job={job} />

        <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Workflow status</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span>{JOB_STATUS_LABEL[job.current_status] ?? job.current_status}</span>
            <span className="text-xs text-muted-foreground">
              · {JOB_PRIORITY_LABEL[job.priority] ?? job.priority}
            </span>
            <JobRoleHoldBadge blockedByRole={job.blocked_by_role} roles={roles} />
          </div>
          {job.status_reason?.trim() ? (
            <p className="mt-2 text-xs text-muted-foreground">{job.status_reason}</p>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-medium">Billing scope</h3>
          <div className="mt-2">
            <FinanceJobBillingBreakdown
              job={job}
              invoice={record}
              summary={billingSummary}
              collapsible={false}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Invoice</h3>
          {invoiceLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : record ? (
            <div className="mt-2 space-y-3 rounded-lg border border-border p-3 text-sm">
              <dl className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Invoice no.</dt>
                  <dd className="font-mono">{record.invoice_no}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{formatPaymentStatusLabel(record.payment_status)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Expected</dt>
                  <dd className="tabular-nums">{record.amount_expected}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Paid</dt>
                  <dd className="tabular-nums">{record.amount_paid}</dd>
                </div>
                {record.paid_at ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Paid at</dt>
                    <dd>{formatPaidAt(record.paid_at)}</dd>
                  </div>
                ) : null}
              </dl>
              {!editing ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                  Edit invoice / record payment
                </Button>
              ) : (
                <EditInvoiceForm
                  record={record}
                  expected={editExpected}
                  paid={editPaid}
                  status={editStatus}
                  onExpectedChange={setEditExpected}
                  onPaidChange={setEditPaid}
                  onStatusChange={setEditStatus}
                  onCancel={() => setEditing(false)}
                  onSuccess={handleSuccess}
                  queryClient={queryClient}
                />
              )}
            </div>
          ) : (
            <div className="mt-2 rounded-lg border border-dashed border-border p-3">
              <p className="text-xs text-muted-foreground">No invoice for this job yet.</p>
              {suggestedAmount ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggested from catalog total: {suggestedAmount} ETB
                </p>
              ) : null}
              <CreateInvoiceForm
                jobId={job.id}
                expectedAmount={createExpected}
                onExpectedAmountChange={setCreateExpected}
                onSuccess={handleSuccess}
                queryClient={queryClient}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button type="button" size="sm" variant="outline" disabled title="Requires reception desk action">
            Put on finance hold
          </Button>
          <p className="text-xs text-muted-foreground">
            Placing a finance hold requires reception desk action — not available to Finance
            accounts yet. Contact reception using the details above.
          </p>
        </div>

        <div>
          <Link
            to={`/staff/finance?tab=discounts&job=${job.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Request discount / waiver for this job →
          </Link>
        </div>
      </div>
    </div>
  );
}
