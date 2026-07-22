import { useMemo } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAllFinancialRecords } from "@/features/laboratory/hooks";
import { shortJobId } from "@/lib/laboratory";
import { needsWaiverReleaseCheck } from "@/lib/laboratory/finance/dashboard-metrics";

export function FinanceWaiverReleaseQueue() {
  const { data: records = [], isLoading, isError } = useAllFinancialRecords();

  const data = useMemo(
    () => records.filter(needsWaiverReleaseCheck),
    [records],
  );

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

  if (!preview.length) return null;

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="finance-waiver-release-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CheckCircle2 className="size-4 text-primary" aria-hidden />
        <h3 id="finance-waiver-release-heading" className="text-sm font-medium">
          Waiver approved — confirm release
        </h3>
        <span className="text-xs text-muted-foreground">
          Director approved; job or gate may still need confirmation
        </span>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border text-sm">
        {preview.map((r) => (
          <li key={r.invoice_no} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <div>
              <span className="font-mono text-xs">{shortJobId(r.job)}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="font-mono text-xs">{r.invoice_no}</span>
              {r.job_status ? (
                <span className="ml-2 text-xs text-muted-foreground">
                  Job: {r.job_status.replace(/_/g, " ")}
                </span>
              ) : null}
            </div>
            <Link
              to={`/staff/finance?tab=discounts&job=${r.job}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Review waiver →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
