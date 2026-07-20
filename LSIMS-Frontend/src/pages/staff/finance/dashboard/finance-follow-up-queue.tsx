import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { clientJobReferenceLabel } from "@/lib/sample-reference-display";
import { formatMoney } from "@/lib/money";
import { formatPaymentStatusLabel } from "@/pages/staff/finance/shared/finance-payment-labels";

import {
  buildJobOrderMap,
  daysSince,
  fetchAllFinancialRecords,
  needsFinanceFollowUp,
  outstandingAmount,
} from "./finance-dashboard-utils";

export function FinanceFollowUpQueue() {
  const { data, isLoading, isError } = useQuery({
    queryKey: dashboardKeys.financeFollowUp,
    queryFn: async () => {
      const records = await fetchAllFinancialRecords();
      const followUp = records.filter(needsFinanceFollowUp);
      const jobMap = await buildJobOrderMap(followUp.map((r) => r.job));
      return { followUp, jobMap };
    },
    staleTime: 60_000,
  });

  const preview = (data?.followUp ?? []).slice(0, 8);
  const jobMap = data?.jobMap ?? new Map();

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
      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4 shadow-sm"
      aria-labelledby="finance-follow-up-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Clock className="size-4 text-amber-600" aria-hidden />
        <h3 id="finance-follow-up-heading" className="text-sm font-medium">
          Needs follow-up
        </h3>
        <span className="text-xs text-muted-foreground">
          Partial payments or pending 7+ days
        </span>
      </div>

      {!preview.length ? (
        <p className="text-sm text-muted-foreground">No invoices need immediate follow-up.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
              {preview.map((r) => {
                const job = jobMap.get(r.job);
                const ref = job
                  ? clientJobReferenceLabel(job.description)
                  : r.job_client_email ?? "—";
                const age = daysSince(r.created_at);
                return (
                  <tr key={r.invoice_no} className="border-b last:border-0">
                    <td className="px-3 py-2 text-xs font-medium">{ref}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.invoice_no}</td>
                    <td className="px-3 py-2 text-xs">
                      {formatPaymentStatusLabel(r.payment_status)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatMoney(outstandingAmount(r))}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {age != null ? `${age} days` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/staff/finance?job=${r.job}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open job →
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
