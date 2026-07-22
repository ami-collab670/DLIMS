import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { shortJobId } from "@/lib/laboratory";
import { formatMoneyFromApi, isWithinDays } from "@/lib/formatting";
import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";
import { formatPaidAt } from "@/lib/laboratory/labels/payment-labels";

import { fetchAllFinancialRecords } from "@/features/laboratory/lib/fetch-all-financial-records";


export function FinanceRecentlyClearedQueue() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: dashboardKeys.financeRecentlyCleared,
    queryFn: async () => {
      const records = await fetchAllFinancialRecords();
      return records
        .filter(
          (r) =>
            r.payment_status === "paid" && r.paid_at && isWithinDays(r.paid_at, 7),
        )
        .sort(
          (a, b) =>
            new Date(b.paid_at ?? 0).getTime() - new Date(a.paid_at ?? 0).getTime(),
        );
    },
    staleTime: 60_000,
  });

  const preview = data.slice(0, 8);

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
      aria-labelledby="finance-cleared-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CheckCircle2 className="size-4 text-primary" aria-hidden />
        <h3 id="finance-cleared-heading" className="text-sm font-medium">
          Recently cleared
        </h3>
        <span className="text-xs text-muted-foreground">Paid in the last 7 days</span>
      </div>

      {!preview.length ? (
        <p className="text-sm text-muted-foreground">No payments recorded this week.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Job</th>
                <th className="px-3 py-2 font-medium">Paid at</th>
                <th className="px-3 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((record) => (
                <tr key={record.invoice_no} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{record.invoice_no}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link
                      to={`/staff/finance?job=${record.job}`}
                      className="text-primary hover:underline"
                    >
                      {shortJobId(record.job)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {formatPaidAt(record.paid_at)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatMoneyFromApi(record.amount_paid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
