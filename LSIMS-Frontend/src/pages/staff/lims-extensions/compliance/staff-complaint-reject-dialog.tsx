import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { rejectComplaint } from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import type { ComplaintRecord } from "@/types/laboratory";

import { toastApiError } from "@/lib/api/toast-api-error";

type Props = {
  complaint: ComplaintRecord;
  onClose: () => void;
  onSuccess: (updated: ComplaintRecord) => void;
};

export function StaffComplaintRejectDialog({
  complaint,
  onClose,
  onSuccess,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  const rejectMut = useMutation({
    mutationFn: () => rejectComplaint(complaint.id, { resolution: reason.trim() }),
    onSuccess: (updated) => {
      toast.success("Complaint rejected.");
      queryClient.setQueryData(laboratoryQueryKeys.complaint(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onSuccess(updated);
      onClose();
    },
    onError: toastApiError,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setReasonError("A rejection reason is required.");
      return;
    }
    setReasonError(null);
    rejectMut.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,480px)] w-full max-w-lg flex-col rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Reject complaint
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div className="space-y-1">
            <Label htmlFor="reject-complaint-reason">Rejection reason</Label>
            <Textarea
              id="reject-complaint-reason"
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              placeholder="Explain why this complaint is being rejected."
            />
            {reasonError ? (
              <p className="text-xs text-destructive">{reasonError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={rejectMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={rejectMut.isPending}>
              {rejectMut.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Rejecting…
                </>
              ) : (
                "Reject complaint"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
