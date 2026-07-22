import { staffFinanceTabUrl } from "@/lib/staff";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";
import { formatMoney } from "@/lib/formatting";

import {
  revenueCollectedInDays,
  sumOutstanding,
  waiverMetrics,
} from "@/lib/laboratory/finance/dashboard-metrics";
import { fetchAllFinancialRecords } from "@/features/laboratory/lib/fetch-all-financial-records";

export function FinanceReportsSnapshot() {
  const { data: records = [], isLoading, isError } = useQuery({
    queryKey: dashboardKeys.financeAllRecords,
    queryFn: () => fetchAllFinancialRecords(),
    staleTime: 60_000,
  });

  const revenue7d = revenueCollectedInDays(records, 7);
  const outstanding = sumOutstanding(records);
  const waivers = waiverMetrics(records);

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
      aria-labelledby="finance-reports-snapshot-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <BarChart3 className="size-4 text-primary" aria-hidden />
        <h3 id="finance-reports-snapshot-heading" className="text-sm font-medium">
          Reports snapshot
        </h3>
        <Link
          to={staffFinanceTabUrl("reports")}
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Full reports →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Revenue (7 days)</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(revenue7d)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Outstanding receivables</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(outstanding)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Waivers granted</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{waivers.count}</p>
          <p className="text-xs text-muted-foreground">{formatMoney(waivers.amount)} waived</p>
        </div>
      </div>
    </section>
  );
}
