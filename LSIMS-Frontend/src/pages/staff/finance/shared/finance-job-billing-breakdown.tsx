import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { JOB_PRIORITY_LABEL } from "@/lib/job-order-labels";
import { formatMoney, parseMoney, formatMoneyFromApi } from "@/lib/money";
import { clientJobReferenceLabel } from "@/lib/sample-reference-display";
import type { FinancialRecord, JobOrder, JobPriority } from "@/types/laboratory";

import { parseJobBillingSummary, type JobBillingSummary } from "./parse-job-billing";

type Props = {
  job: Pick<JobOrder, "id" | "description" | "priority">;
  invoice?: FinancialRecord | null;
  summary?: JobBillingSummary;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showMeta?: boolean;
};

export function FinanceJobBillingBreakdown({
  job,
  invoice,
  summary: summaryProp,
  collapsible = false,
  defaultExpanded = true,
  showMeta = true,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const summary = useMemo(
    () => summaryProp ?? parseJobBillingSummary(job.description),
    [summaryProp, job.description],
  );

  const refLabel = clientJobReferenceLabel(job.description);
  const priorityLabel =
    JOB_PRIORITY_LABEL[job.priority as JobPriority] ?? summary.priority ?? job.priority;

  const invoiceExpected = invoice ? parseMoney(invoice.amount_expected) : null;
  const mismatch =
    invoiceExpected != null &&
    summary.indicativeTotal != null &&
    Math.abs(invoiceExpected - summary.indicativeTotal) > 0.01;

  const table = (
    <div className="space-y-2">
      {showMeta ? (
        <dl className="grid gap-1 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Client reference</dt>
            <dd className="font-medium">{refLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Priority</dt>
            <dd>{priorityLabel}</dd>
          </div>
          {summary.sampleCount != null ? (
            <div>
              <dt className="text-muted-foreground">Samples</dt>
              <dd>{summary.sampleCount}</dd>
            </div>
          ) : null}
          {summary.confirmationCode ? (
            <div>
              <dt className="text-muted-foreground">Confirmation</dt>
              <dd className="font-mono">{summary.confirmationCode}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {summary.lines.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-2 py-1.5 font-medium">Code</th>
                <th className="px-2 py-1.5 font-medium">Test</th>
                <th className="px-2 py-1.5 font-medium">Unit</th>
                <th className="px-2 py-1.5 font-medium text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {summary.lines.map((line) => (
                <tr key={line.testCode} className="border-b last:border-0">
                  <td className="px-2 py-1.5 font-mono">{line.testCode}</td>
                  <td className="px-2 py-1.5">
                    <span className="block">{line.testName}</span>
                    <span className="text-muted-foreground">{line.department}</span>
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">{line.unit ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatMoney(line.priceEtb)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {summary.parseWarnings[0] ?? "No catalog pricing breakdown available."}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {summary.indicativeTotal != null ? (
          <span>
            Indicative total:{" "}
            <strong className="tabular-nums">{formatMoney(summary.indicativeTotal)}</strong>
          </span>
        ) : null}
        {invoice ? (
          <span className="text-muted-foreground">
            Invoice expected:{" "}
            <span className="tabular-nums">{formatMoneyFromApi(invoice.amount_expected)}</span>
          </span>
        ) : null}
      </div>

      {mismatch ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Invoice amount differs from indicative catalog total — confirm before marking paid.
        </p>
      ) : null}

      {summary.parseWarnings.length > 0 && summary.lines.length > 0 ? (
        <p className="text-xs text-muted-foreground">{summary.parseWarnings.join(" ")}</p>
      ) : null}
    </div>
  );

  if (!collapsible) {
    return table;
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1 px-2 text-xs"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? (
          <ChevronDown className="size-3.5" aria-hidden />
        ) : (
          <ChevronRight className="size-3.5" aria-hidden />
        )}
        Billing scope
        {summary.lines.length > 0 ? (
          <span className="text-muted-foreground">({summary.lines.length} tests)</span>
        ) : null}
      </Button>
      {expanded ? table : null}
    </div>
  );
}
