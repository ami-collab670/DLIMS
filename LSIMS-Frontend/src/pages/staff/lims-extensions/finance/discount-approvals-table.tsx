import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { shortJobId } from "@/lib/laboratory";
import type { DiscountApproval, DiscountApprovalStatus } from "@/types/laboratory";

const STATUS_FILTERS: { value: DiscountApprovalStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

type DiscountApprovalsTableProps = {
  statusFilter: DiscountApprovalStatus;
  onStatusFilterChange: (status: DiscountApprovalStatus) => void;
  rows: DiscountApproval[];
  isLoading: boolean;
  isError: boolean;
  canReview: boolean;
  onReviewClick: (approval: DiscountApproval) => void;
};

export function DiscountApprovalsTable({
  statusFilter,
  onStatusFilterChange,
  rows,
  isLoading,
  isError,
  canReview,
  onReviewClick,
}: DiscountApprovalsTableProps) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={statusFilter === value ? "default" : "outline"}
            onClick={() => onStatusFilterChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-destructive">Could not load discount approvals.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Job</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Reason</th>
                  <th className="px-4 py-2 font-medium">Director note</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">{shortJobId(d.job)}</td>
                    <td className="px-4 py-2 capitalize">{d.status}</td>
                    <td className="px-4 py-2 capitalize">{d.discount_type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {d.percentage ? `${d.percentage}%` : d.amount ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2 text-xs">{d.reason}</td>
                    <td className="max-w-[160px] truncate px-4 py-2 text-xs text-muted-foreground">
                      {d.review_note?.trim() || "—"}
                    </td>
                    <td className="px-4 py-2">
                      {canReview && d.status === "pending" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onReviewClick(d)}
                        >
                          Review
                        </Button>
                      ) : d.status === "pending" ? (
                        <span className="text-xs text-muted-foreground">Awaiting director</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No {statusFilter} discount requests.
          </p>
        ) : null}
      </div>
    </>
  );
}
