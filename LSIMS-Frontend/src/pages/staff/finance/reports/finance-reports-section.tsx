import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { fetchJobOrder } from "@/features/jobs/api";
import { shortJobId } from "@/lib/job-order-labels";
import {
  fetchAllFinancialRecords,
  formatMoney,
  outstandingAmount,
  parseMoney,
} from "@/pages/staff/finance/dashboard/finance-dashboard-utils";

async function fetchJobCreatedAtMap(records: Awaited<ReturnType<typeof fetchAllFinancialRecords>>) {
  const jobIds = [
    ...new Set(
      records
        .filter((r) => r.payment_status === "paid" && r.paid_at)
        .map((r) => r.job),
    ),
  ];
  const map = new Map<string, string>();
  await Promise.all(
    jobIds.map(async (id) => {
      try {
        const job = await fetchJobOrder(id);
        map.set(id, job.created_at);
      } catch {
        /* job may be inaccessible */
      }
    }),
  );
  return map;
}

async function fetchFinanceReportData() {
  const records = await fetchAllFinancialRecords();
  const jobCreatedAt = await fetchJobCreatedAtMap(records);
  return { records, jobCreatedAt };
}

export function FinanceReportsSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["finance-reports-records"],
    queryFn: fetchFinanceReportData,
    staleTime: 60_000,
  });

  const records = data?.records ?? [];
  const jobCreatedAt = data?.jobCreatedAt ?? new Map<string, string>();

  const metrics = useMemo(() => {
    let revenueCollected = 0;
    let outstandingTotal = 0;
    let waiverCount = 0;
    let waiverAmount = 0;
    const intakeToPaidDays: number[] = [];

    for (const r of records) {
      revenueCollected += parseMoney(r.amount_paid);
      outstandingTotal += outstandingAmount(r);

      if (!r.payment_required && r.waiver_approved_at) {
        waiverCount += 1;
        waiverAmount += parseMoney(r.amount_expected);
      }

      if (r.payment_status === "paid" && r.paid_at) {
        const created = jobCreatedAt.get(r.job);
        if (created) {
          const days =
            (new Date(r.paid_at).getTime() - new Date(created).getTime()) /
            (1000 * 60 * 60 * 24);
          if (Number.isFinite(days) && days >= 0) {
            intakeToPaidDays.push(days);
          }
        }
      }
    }

    const avgIntakeToPaid =
      intakeToPaidDays.length > 0
        ? intakeToPaidDays.reduce((a, b) => a + b, 0) / intakeToPaidDays.length
        : null;

    return {
      revenueCollected,
      outstandingTotal,
      waiverCount,
      waiverAmount,
      avgIntakeToPaid,
      recordCount: records.length,
    };
  }, [records, jobCreatedAt]);

  function downloadCsv() {
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Could not load finance report data.</p>;
  }

  return (
    <section className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Client-side summary from financial records already loaded via the API. Average intake-to-paid
        pairs each paid invoice with the job intake timestamp from the job API.
      </p>

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

      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={downloadCsv}>
        <Download className="size-4" />
        Export CSV ({metrics.recordCount} records)
      </Button>
    </section>
  );
}
