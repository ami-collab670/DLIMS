import { staffFinanceTabUrl } from "@/lib/staff";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Shield } from "lucide-react";
import { Link } from "react-router-dom";

import { shortJobId } from "@/lib/laboratory";
import { daysSince, formatMoney } from "@/lib/formatting";
import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";
import { formatPaymentStatusLabel } from "@/lib/laboratory/labels/payment-labels";

import { outstandingAmount } from "@/lib/laboratory/finance/dashboard-metrics";
import { fetchAllFinancialRecords } from "@/features/laboratory/lib/fetch-all-financial-records";

export function FinanceCompliancePreview() {
  const { data: records = [], isLoading, isError } = useQuery({
    queryKey: dashboardKeys.financeAllRecords,
    queryFn: () => fetchAllFinancialRecords(),
    staleTime: 60_000,
  });

  const preview = records
    .filter(
      (r) =>
        r.payment_required &&
        !r.waiver_approved_at &&
        (r.payment_status === "pending" || r.payment_status === "partial"),
    )
    .sort((a, b) => outstandingAmount(b) - outstandingAmount(a))
    .slice(0, 5);

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
      aria-labelledby="finance-compliance-preview-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Shield className="size-4 text-primary" aria-hidden />
        <h3 id="finance-compliance-preview-heading" className="text-sm font-medium">
          Payment audit preview
        </h3>
        <Link
          to={staffFinanceTabUrl("compliance")}
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Full payment audit →
        </Link>
      </div>

      {!preview.length ? (
        <p className="text-sm text-muted-foreground">No outstanding invoices in the audit queue.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Job</th>
                <th className="px-3 py-2 font-medium">Outstanding</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r) => {
                const age = daysSince(r.created_at);
                return (
                  <tr key={r.invoice_no} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{r.invoice_no}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link
                        to={`/staff/finance?job=${r.job}`}
                        className="text-primary hover:underline"
                      >
                        {shortJobId(r.job)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatMoney(outstandingAmount(r))}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {formatPaymentStatusLabel(r.payment_status)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {age != null ? `${age}d` : "—"}
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
