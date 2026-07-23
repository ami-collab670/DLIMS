import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney, formatMoneyFromApi } from "@/lib/formatting";
import { shortJobId, clientJobReferenceLabel } from "@/lib/laboratory";
import { outstandingAmount } from "@/lib/laboratory/finance/dashboard-metrics";
import {
  formatPaidAt,
  formatPaymentStatusLabel,
} from "@/lib/laboratory/labels/payment-labels";
import { hasClientSearchQuery } from "@/lib/staff/receptionist/client-search";
import { MarkPaidButton } from "@/pages/staff/finance/shared/finance-invoice-actions";
import type { FinancialRecord, JobOrder } from "@/types/laboratory";

type FinanceInvoicesTableProps = {
  readOnlyFinance: boolean;
  showFinanceTables: boolean;
  debouncedFinanceSearch: string;
  isLoading: boolean;
  isError: boolean;
  filteredRows: FinancialRecord[];
  jobById: Map<string, JobOrder>;
  onEditRecord: (record: FinancialRecord) => void;
};

export function FinanceInvoicesTable({
  readOnlyFinance,
  showFinanceTables,
  debouncedFinanceSearch,
  isLoading,
  isError,
  filteredRows,
  jobById,
  onEditRecord,
}: FinanceInvoicesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="p-4 text-destructive">Could not load financial records.</p>
      ) : !showFinanceTables ? (
        <p className="p-6 text-sm text-muted-foreground">
          Search by client name, phone, or email to view invoices.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2 font-medium">Invoice</th>
                <th className="px-4 py-2 font-medium">Job reference</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Expected</th>
                <th className="px-4 py-2 font-medium">Paid</th>
                <th className="px-4 py-2 font-medium">Outstanding</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Paid at</th>
                <th className="px-4 py-2 font-medium">Waiver</th>
                {!readOnlyFinance ? <th className="px-4 py-2 font-medium" /> : null}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => {
                const linkedJob = jobById.get(r.job);
                const refLabel = linkedJob
                  ? clientJobReferenceLabel(linkedJob.description)
                  : shortJobId(r.job);
                return (
                  <tr key={r.invoice_no} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">{r.invoice_no}</td>
                    <td className="px-4 py-2">
                      <span className="block text-xs font-medium">{refLabel}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {shortJobId(r.job)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {r.job_client_email ?? "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {formatMoneyFromApi(r.amount_expected)}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{formatMoneyFromApi(r.amount_paid)}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {formatMoney(outstandingAmount(r))}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {formatPaymentStatusLabel(r.payment_status)}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {formatPaidAt(r.paid_at)}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-2 text-xs">
                      {r.waiver_approved_at
                        ? r.waiver_reason || "Approved waiver"
                        : r.payment_required
                          ? "—"
                          : "Not required"}
                    </td>
                    {!readOnlyFinance ? (
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onEditRecord(r)}
                          >
                            Edit
                          </Button>
                          {r.payment_status !== "paid" && !r.waiver_approved_at ? (
                            <MarkPaidButton record={r} />
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showFinanceTables && !isLoading && filteredRows.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          {readOnlyFinance && hasClientSearchQuery(debouncedFinanceSearch)
            ? "No invoices match your search."
            : "No invoices yet."}
        </p>
      ) : null}
    </div>
  );
}
