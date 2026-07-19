import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { fetchComplaints } from "@/features/laboratory/complaints-api";
import { shortJobId } from "@/lib/job-order-labels";
import { isFinance } from "@/lib/staff-permissions";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import {
  fetchAllFinancialRecords,
  formatMoney,
  outstandingAmount,
} from "@/pages/staff/finance/dashboard/finance-dashboard-utils";
import {
  formatPaidAt,
  formatPaymentStatusLabel,
} from "@/pages/staff/finance/shared/finance-payment-labels";
import { useAuthStore } from "@/stores/auth-store";
import type { FinancialRecord } from "@/types/laboratory";

type AuditFilter = "all" | "outstanding" | "paid" | "waived";

function waiverLabel(record: FinancialRecord): string {
  if (record.waiver_approved_at) {
    return record.waiver_reason?.trim() || "Waiver approved";
  }
  if (!record.payment_required) return "Not required";
  return "—";
}

export function FinancePaymentComplianceSection() {
  const user = useAuthStore((s) => s.user);
  const financeUser = isFinance(user);
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");

  const {
    data: records = [],
    isLoading: recordsLoading,
    isError: recordsError,
  } = useQuery({
    queryKey: dashboardKeys.financeAllRecords,
    queryFn: fetchAllFinancialRecords,
    staleTime: 60_000,
  });

  const { data: paymentComplaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ["finance-payment-complaints"],
    queryFn: () => fetchComplaints({ page: 1, page_size: 10, category: "payment" }),
    staleTime: 60_000,
    enabled: !financeUser,
    retry: false,
  });

  const filteredRecords = useMemo(() => {
    switch (auditFilter) {
      case "outstanding":
        return records.filter(
          (r) =>
            r.payment_required &&
            !r.waiver_approved_at &&
            (r.payment_status === "pending" || r.payment_status === "partial"),
        );
      case "paid":
        return records.filter((r) => r.payment_status === "paid");
      case "waived":
        return records.filter((r) => Boolean(r.waiver_approved_at) || !r.payment_required);
      default:
        return records;
    }
  }, [auditFilter, records]);

  function downloadAuditCsv() {
    if (!filteredRecords.length) return;
    const headers = [
      "invoice_no",
      "job_short_id",
      "amount_expected",
      "amount_paid",
      "outstanding",
      "payment_status",
      "created_at",
      "paid_at",
      "waiver",
    ];
    const rows = filteredRecords.map((r) =>
      [
        r.invoice_no,
        shortJobId(r.job),
        r.amount_expected,
        r.amount_paid,
        outstandingAmount(r).toFixed(2),
        formatPaymentStatusLabel(r.payment_status),
        r.created_at,
        r.paid_at ?? "",
        waiverLabel(r),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const content = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lsims-payment-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const AUDIT_FILTERS: { value: AuditFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "outstanding", label: "Outstanding" },
    { value: "paid", label: "Paid" },
    { value: "waived", label: "Waived" },
  ];

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Payment audit trail</h3>
        <p className="text-xs text-muted-foreground">
          Invoice lifecycle for finance compliance — amounts, payment dates, and waiver status.
        </p>

        <div className="flex flex-wrap gap-2">
          {AUDIT_FILTERS.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={auditFilter === value ? "default" : "outline"}
              onClick={() => setAuditFilter(value)}
            >
              {label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto gap-2"
            disabled={!filteredRecords.length}
            onClick={downloadAuditCsv}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>

        {recordsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : recordsError ? (
          <p className="text-sm text-destructive">Could not load payment audit data.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2 font-medium">Invoice</th>
                    <th className="px-4 py-2 font-medium">Job</th>
                    <th className="px-4 py-2 font-medium">Expected</th>
                    <th className="px-4 py-2 font-medium">Paid</th>
                    <th className="px-4 py-2 font-medium">Outstanding</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Created</th>
                    <th className="px-4 py-2 font-medium">Paid at</th>
                    <th className="px-4 py-2 font-medium">Waiver</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => (
                    <tr key={r.invoice_no} className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">{r.invoice_no}</td>
                      <td className="px-4 py-2 font-mono text-xs">{shortJobId(r.job)}</td>
                      <td className="px-4 py-2 tabular-nums">{r.amount_expected}</td>
                      <td className="px-4 py-2 tabular-nums">{r.amount_paid}</td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatMoney(outstandingAmount(r))}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {formatPaymentStatusLabel(r.payment_status)}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {formatPaidAt(r.created_at)}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {formatPaidAt(r.paid_at)}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-2 text-xs">
                        {waiverLabel(r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRecords.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No records match this filter.</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <h3 className="text-sm font-semibold">Payment disputes</h3>
        {financeUser ? (
          <p className="text-sm text-muted-foreground">
            Payment dispute records are not visible to Finance accounts yet — contact reception
            or the lab director. A backend permission update is required before this list can load
            here.
          </p>
        ) : complaintsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : paymentComplaints?.results.length ? (
          <ul className="space-y-2 text-sm">
            {paymentComplaints.results.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-card px-3 py-2">
                <span className="font-medium capitalize">{c.status.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground"> — {c.description.slice(0, 120)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No open payment-category disputes.</p>
        )}
      </div>
    </section>
  );
}
