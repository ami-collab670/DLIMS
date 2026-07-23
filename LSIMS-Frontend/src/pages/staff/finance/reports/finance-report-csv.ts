import { shortJobId } from "@/lib/laboratory";
import type { FinancialRecord } from "@/types/laboratory";

import type { FinanceReportMetrics } from "./finance-report-metrics-cards";

export function downloadFinanceReportCsv(
  records: FinancialRecord[],
  metrics: FinanceReportMetrics,
): void {
  if (!records.length) return;

  const headers = [
    "invoice_no",
    "job_short_id",
    "amount_expected",
    "amount_paid",
    "payment_status",
    "paid_at",
    "payment_required",
    "waiver_reason",
  ];
  const rows = records.map((r) =>
    [
      r.invoice_no,
      shortJobId(r.job),
      r.amount_expected,
      r.amount_paid,
      r.payment_status,
      r.paid_at ?? "",
      r.payment_required ? "yes" : "no",
      r.waiver_reason ?? "",
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  const summary = [
    "",
    `"summary","revenue_collected","${metrics.revenueCollected.toFixed(2)}"`,
    `"summary","outstanding_total","${metrics.outstandingTotal.toFixed(2)}"`,
    `"summary","waiver_count","${metrics.waiverCount}"`,
    `"summary","waiver_amount","${metrics.waiverAmount.toFixed(2)}"`,
    `"summary","avg_intake_to_paid_days","${metrics.avgIntakeToPaid?.toFixed(1) ?? ""}"`,
  ];
  const content = [headers.join(","), ...rows, ...summary].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lsims-finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
