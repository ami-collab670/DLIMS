import { useQueries } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { fetchJobOrder } from "@/features/jobs/api";
import { jobKeys } from "@/features/jobs/query-keys";
import { useAllFinancialRecords } from "@/features/laboratory/hooks";
import {
  avgIntakeToPaidDays,
  sumAmountPaid,
  sumOutstanding,
  waiverMetricsNonPaymentRequired,
} from "@/lib/laboratory/finance/dashboard-metrics";

import { downloadFinanceReportCsv } from "./finance-report-csv";
import { FinanceReportMetricsCards } from "./finance-report-metrics-cards";

const JOB_QUERY_STALE_MS = 60_000;

export function FinanceReportsSection() {
  const {
    data: records = [],
    isLoading: recordsLoading,
    isError: recordsError,
  } = useAllFinancialRecords({ staleTime: 60_000 });

  const paidJobIds = useMemo(
    () => [
      ...new Set(
        records
          .filter((r) => r.payment_status === "paid" && r.paid_at)
          .map((r) => r.job),
      ),
    ],
    [records],
  );

  const jobQueries = useQueries({
    queries: paidJobIds.map((id) => ({
      queryKey: jobKeys.detail(id),
      queryFn: () => fetchJobOrder(id),
      staleTime: JOB_QUERY_STALE_MS,
      retry: false,
    })),
  });

  const jobCreatedAt = useMemo(() => {
    const map = new Map<string, string>();
    for (const query of jobQueries) {
      if (query.data) {
        map.set(query.data.id, query.data.created_at);
      }
    }
    return map;
  }, [jobQueries]);

  const jobsLoading =
    paidJobIds.length > 0 && jobQueries.some((q) => q.isLoading);

  const metrics = useMemo(() => {
    const waivers = waiverMetricsNonPaymentRequired(records);
    return {
      revenueCollected: sumAmountPaid(records),
      outstandingTotal: sumOutstanding(records),
      waiverCount: waivers.count,
      waiverAmount: waivers.amount,
      avgIntakeToPaid: avgIntakeToPaidDays(records, jobCreatedAt),
      recordCount: records.length,
    };
  }, [records, jobCreatedAt]);

  const isLoading = recordsLoading || jobsLoading;
  const isError = recordsError;

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

      <FinanceReportMetricsCards metrics={metrics} />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => downloadFinanceReportCsv(records, metrics)}
      >
        <Download className="size-4" />
        Export CSV ({metrics.recordCount} records)
      </Button>
    </section>
  );
}
