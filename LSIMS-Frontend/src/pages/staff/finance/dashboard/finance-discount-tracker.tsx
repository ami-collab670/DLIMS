import { useQuery } from "@tanstack/react-query";
import { Loader2, Percent } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { fetchDiscountApprovals } from "@/features/laboratory/discount-approvals-api";
import { shortJobId } from "@/lib/job-order-labels";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import type { DiscountApprovalStatus } from "@/types/laboratory";

const STATUS_TABS: { value: DiscountApprovalStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function FinanceDiscountTracker() {
  const [statusTab, setStatusTab] = useState<DiscountApprovalStatus>("pending");

  const { data, isLoading, isError } = useQuery({
    queryKey: dashboardKeys.financeDiscountTracker,
    queryFn: async () => {
      const [pending, approved, rejected] = await Promise.all([
        fetchDiscountApprovals({ page: 1, status: "pending" }),
        fetchDiscountApprovals({ page: 1, status: "approved" }),
        fetchDiscountApprovals({ page: 1, status: "rejected" }),
      ]);
      return {
        pending: pending.results.slice(0, 5),
        approved: approved.results.slice(0, 5),
        rejected: rejected.results.slice(0, 5),
      };
    },
    staleTime: 60_000,
  });

  const rows =
    statusTab === "pending"
      ? (data?.pending ?? [])
      : statusTab === "approved"
        ? (data?.approved ?? [])
        : (data?.rejected ?? []);

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
      aria-labelledby="finance-discount-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Percent className="size-4 text-primary" aria-hidden />
        <h3 id="finance-discount-heading" className="text-sm font-medium">
          Discount / waiver tracker
        </h3>
        <Link
          to="/staff/finance?tab=discounts"
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Manage requests →
        </Link>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Finance submits requests; lab director approves or rejects. Status only — no approve
        action here.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {STATUS_TABS.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={statusTab === value ? "default" : "outline"}
            onClick={() => setStatusTab(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {!rows.length ? (
        <p className="text-sm text-muted-foreground">No {statusTab} discount requests.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border text-sm">
          {rows.map((row) => (
            <li key={row.id} className="px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  to={`/staff/finance?tab=discounts&job=${row.job}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {shortJobId(row.job)}
                </Link>
                <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                  {row.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{row.reason}</p>
              {row.review_note?.trim() ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Director: {row.review_note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
