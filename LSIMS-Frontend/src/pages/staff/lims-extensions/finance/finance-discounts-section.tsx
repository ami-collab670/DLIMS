import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveDiscountApproval,
  createDiscountApproval,
  fetchDiscountApprovals,
  rejectDiscountApproval,
} from "@/features/laboratory/discount-approvals-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import {
  canApproveDiscountApproval,
  canRequestDiscountApproval,
} from "@/lib/staff-permissions";
import { invalidateFinanceWorkflowQueries } from "@/pages/staff/lims-extensions/finance/finance-invoices-section";
import { useAuthStore } from "@/stores/auth-store";
import type { DiscountApproval, DiscountType } from "@/types/laboratory";

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed_amount", label: "Fixed amount" },
  { value: "free_test", label: "Free test / full waiver" },
];

export function FinanceDiscountsSection() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canReview = canApproveDiscountApproval(user);
  const canRequest = canRequestDiscountApproval(user);

  const [selected, setSelected] = useState<DiscountApproval | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [requestJob, setRequestJob] = useState("");
  const [requestType, setRequestType] = useState<DiscountType>("percentage");
  const [requestPercent, setRequestPercent] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: laboratoryQueryKeys.discountApprovals({ status: "pending" }),
    queryFn: () => fetchDiscountApprovals({ page: 1, status: "pending" }),
    staleTime: 20_000,
  });

  const invalidate = (jobId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ["discount-approvals"] });
    invalidateFinanceWorkflowQueries(queryClient, jobId);
  };

  const createMut = useMutation({
    mutationFn: () =>
      createDiscountApproval({
        job: requestJob.trim(),
        discount_type: requestType,
        percentage: requestType === "percentage" ? requestPercent.trim() : null,
        amount: requestType === "fixed_amount" ? requestAmount.trim() : null,
        reason: requestReason.trim(),
      }),
    onSuccess: () => {
      toast.success("Discount request submitted for director review.");
      setShowRequest(false);
      setRequestJob("");
      setRequestReason("");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const approveMut = useMutation({
    mutationFn: () =>
      approveDiscountApproval(selected!.id, {
        review_note: reviewNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Discount approved.");
      const jobId = selected?.job;
      setSelected(null);
      setReviewNote("");
      invalidate(jobId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      rejectDiscountApproval(selected!.id, {
        review_note: reviewNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Discount rejected.");
      setSelected(null);
      setReviewNote("");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rows = data?.results ?? [];

  return (
    <section className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Finance or reception can request discounts. Only lab director or admin can approve —
        approved waivers bypass the payment gate on the linked invoice.
      </p>

      {canRequest ? (
        <div className="space-y-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowRequest((s) => !s)}
          >
            {showRequest ? "Cancel request" : "Request discount"}
          </Button>
          {showRequest ? (
            <form
              className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!requestJob.trim() || requestReason.trim().length < 3) {
                  toast.error("Job ID and reason are required.");
                  return;
                }
                createMut.mutate();
              }}
            >
              <div className="space-y-1 md:col-span-2">
                <Label>Job ID</Label>
                <Input value={requestJob} onChange={(e) => setRequestJob(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Discount type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as DiscountType)}
                >
                  {DISCOUNT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {requestType === "percentage" ? (
                <div className="space-y-1">
                  <Label>Percentage</Label>
                  <Input
                    inputMode="decimal"
                    value={requestPercent}
                    onChange={(e) => setRequestPercent(e.target.value)}
                  />
                </div>
              ) : requestType === "fixed_amount" ? (
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input
                    inputMode="decimal"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="space-y-1 md:col-span-2">
                <Label>Reason</Label>
                <Textarea
                  rows={2}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={createMut.isPending}>
                  Submit request
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-destructive">Could not load discount approvals.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Job</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Reason</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">{shortJobId(d.job)}</td>
                    <td className="px-4 py-2 capitalize">{d.discount_type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {d.percentage ? `${d.percentage}%` : d.amount ?? "—"}
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-2 text-xs">{d.reason}</td>
                    <td className="px-4 py-2">
                      {canReview ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelected(d);
                            setReviewNote("");
                          }}
                        >
                          Review
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Awaiting director</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No pending discount requests.</p>
        ) : null}
      </div>

      {selected && canReview ? (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Review discount — {shortJobId(selected.job)}</p>
          <div className="space-y-1">
            <Label>Review note</Label>
            <Textarea
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={approveMut.isPending} onClick={() => approveMut.mutate()}>
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectMut.isPending}
              onClick={() => rejectMut.mutate()}
            >
              Reject
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
