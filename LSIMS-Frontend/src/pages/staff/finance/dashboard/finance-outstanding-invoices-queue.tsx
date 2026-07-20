import { useQuery } from "@tanstack/react-query";
import { Loader2, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { shortJobId } from "@/lib/job-order-labels";
import { clientJobReferenceLabel } from "@/lib/sample-reference-display";
import { formatMoney } from "@/lib/money";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { formatPaymentStatusLabel } from "@/pages/staff/finance/shared/finance-payment-labels";

import {
  buildJobOrderMap,
  daysSince,
  fetchAllFinancialRecords,
  outstandingAmount,
} from "./finance-dashboard-utils";

export function FinanceOutstandingInvoicesQueue() {
  const { data, isLoading, isError } = useQuery({
    queryKey: dashboardKeys.financeOutstanding,
    queryFn: async () => {
      const records = await fetchAllFinancialRecords();
      const outstanding = records.filter(
        (r) => r.payment_status === "pending" || r.payment_status === "partial",
      );
      const jobMap = await buildJobOrderMap(outstanding.map((r) => r.job));
      return { outstanding, jobMap };
    },
    staleTime: 60_000,
  });

  const preview = (data?.outstanding ?? []).slice(0, 8);
  const jobMap = data?.jobMap ?? new Map();
  const totalCount = data?.outstanding.length ?? 0;

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
      aria-labelledby="finance-outstanding-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Wallet className="size-4 text-primary" aria-hidden />
        <h3 id="finance-outstanding-heading" className="text-sm font-medium">
          Outstanding invoices
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalCount} pending or partial
        </span>
      </div>

      {!preview.length ? (
        <p className="text-sm text-muted-foreground">No outstanding invoices.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 font-medium">Reference</th>
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Balance</th>
                <th className="px-3 py-2 font-medium">Age</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {preview.map((record) => {
                const job = jobMap.get(record.job);
                const ref = job
                  ? clientJobReferenceLabel(job.description)
                  : shortJobId(record.job);
                const age = daysSince(record.created_at);
                return (
                  <tr key={record.invoice_no} className="border-b last:border-0">
                    <td className="px-3 py-2 text-xs font-medium">{ref}</td>
                    <td className="px-3 py-2 font-mono text-xs">{record.invoice_no}</td>
                    <td className="px-3 py-2 text-xs">
                      {formatPaymentStatusLabel(record.payment_status)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatMoney(outstandingAmount(record))}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {age != null ? `${age}d` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/staff/finance?job=${record.job}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Record payment
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
