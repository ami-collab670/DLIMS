import { formatMoney } from "@/lib/formatting";

export type FinanceReportMetrics = {
  revenueCollected: number;
  outstandingTotal: number;
  waiverCount: number;
  waiverAmount: number;
  avgIntakeToPaid: number | null;
  recordCount: number;
};

type FinanceReportMetricsCardsProps = {
  metrics: FinanceReportMetrics;
};

export function FinanceReportMetricsCards({ metrics }: FinanceReportMetricsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Revenue collected</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {formatMoney(metrics.revenueCollected)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Outstanding receivables</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {formatMoney(metrics.outstandingTotal)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Waivers granted</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{metrics.waiverCount}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatMoney(metrics.waiverAmount)} waived
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Avg. intake → paid</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {metrics.avgIntakeToPaid != null
            ? `${metrics.avgIntakeToPaid.toFixed(1)} days`
            : "—"}
        </p>
      </div>
    </div>
  );
}
