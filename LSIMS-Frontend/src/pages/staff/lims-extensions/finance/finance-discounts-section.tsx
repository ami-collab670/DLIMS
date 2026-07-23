import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useApproveDiscountApproval,
  useCreateDiscountApproval,
  useDiscountApprovals,
  useRejectDiscountApproval,
} from "@/features/laboratory/hooks";
import { invalidateFinanceWorkflowQueries } from "@/features/laboratory/lib/invalidate-finance-workflow-queries";
import {
  canApproveDiscountApproval,
  canRequestDiscountApproval,
  isFinance,
} from "@/lib/staff";
import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { DiscountApproval, DiscountApprovalStatus, DiscountType } from "@/types/laboratory";

import { DiscountApprovalsTable } from "./discount-approvals-table";
import { DiscountRequestForm } from "./discount-request-form";
import { DiscountReviewPanel } from "./discount-review-panel";

export function FinanceDiscountsSection({
  prefillJobId = "",
}: {
  prefillJobId?: string;
}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canReview = canApproveDiscountApproval(user);
  const canRequest = canRequestDiscountApproval(user);
  const financeUser = isFinance(user);

  const [statusFilter, setStatusFilter] = useState<DiscountApprovalStatus>("pending");
  const [selected, setSelected] = useState<DiscountApproval | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [requestJob, setRequestJob] = useState("");
  const [requestType, setRequestType] = useState<DiscountType>("percentage");
  const [requestPercent, setRequestPercent] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");

  useEffect(() => {
    if (prefillJobId.trim()) {
      setRequestJob(prefillJobId.trim());
      setShowRequest(true);
    }
  }, [prefillJobId]);

  const { data, isLoading, isError } = useDiscountApprovals(
    { page: 1, status: statusFilter },
    { staleTime: 20_000 },
  );

  const invalidateAfterDiscountChange = useCallback(
    (jobId?: string) => {
      void queryClient.invalidateQueries({ queryKey: ["discount-approvals"] });
      invalidateFinanceWorkflowQueries(queryClient, jobId);
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeDiscountTracker });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeKpis });
    },
    [queryClient],
  );

  const createMut = useCreateDiscountApproval({
    onSuccess: () => {
      toast.success("Discount request submitted for director review.");
      setShowRequest(false);
      setRequestReason("");
      invalidateAfterDiscountChange(requestJob.trim());
    },
  });

  const approveMut = useApproveDiscountApproval({
    onSuccess: () => {
      toast.success("Discount approved.");
      const jobId = selected?.job;
      setSelected(null);
      setReviewNote("");
      invalidateAfterDiscountChange(jobId);
    },
  });

  const rejectMut = useRejectDiscountApproval({
    onSuccess: () => {
      toast.success("Discount rejected.");
      setSelected(null);
      setReviewNote("");
      invalidateAfterDiscountChange();
    },
  });

  const rows = data?.results ?? [];

  function handleCreateSubmit() {
    if (!requestJob.trim() || requestReason.trim().length < 3) {
      toast.error("Job ID and reason are required.");
      return;
    }
    createMut.mutate({
      job: requestJob.trim(),
      discount_type: requestType,
      percentage: requestType === "percentage" ? requestPercent.trim() : null,
      amount: requestType === "fixed_amount" ? requestAmount.trim() : null,
      reason: requestReason.trim(),
    });
  }

  function handleApprove() {
    if (!selected) return;
    approveMut.mutate({
      id: selected.id,
      body: { review_note: reviewNote.trim() || undefined },
    });
  }

  function handleReject() {
    if (!selected) return;
    rejectMut.mutate({
      id: selected.id,
      body: { review_note: reviewNote.trim() || undefined },
    });
  }

  return (
    <section className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {financeUser
          ? "Submit waiver requests for lab director review. Track pending, approved, and rejected decisions below — Finance cannot approve requests here."
          : "Finance or reception can request discounts. Only lab director or admin can approve — approved waivers bypass the payment gate on the linked invoice."}
      </p>

      {canRequest ? (
        <DiscountRequestForm
          showRequest={showRequest}
          onToggleShow={() => setShowRequest((s) => !s)}
          requestJob={requestJob}
          onRequestJobChange={setRequestJob}
          requestType={requestType}
          onRequestTypeChange={setRequestType}
          requestPercent={requestPercent}
          onRequestPercentChange={setRequestPercent}
          requestAmount={requestAmount}
          onRequestAmountChange={setRequestAmount}
          requestReason={requestReason}
          onRequestReasonChange={setRequestReason}
          onSubmit={handleCreateSubmit}
          isPending={createMut.isPending}
        />
      ) : null}

      <DiscountApprovalsTable
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        canReview={canReview}
        onReviewClick={(d) => {
          setSelected(d);
          setReviewNote("");
        }}
      />

      {selected && canReview ? (
        <DiscountReviewPanel
          selected={selected}
          reviewNote={reviewNote}
          onReviewNoteChange={setReviewNote}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={() => setSelected(null)}
          approvePending={approveMut.isPending}
          rejectPending={rejectMut.isPending}
        />
      ) : null}
    </section>
  );
}
