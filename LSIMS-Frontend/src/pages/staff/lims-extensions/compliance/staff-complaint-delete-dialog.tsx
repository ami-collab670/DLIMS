import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteComplaint } from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import type { ComplaintRecord } from "@/types/laboratory";

import { toastApiError } from "@/lib/api/toast-api-error";

type Props = {
  complaint: ComplaintRecord;
  onClose: () => void;
  onSuccess: () => void;
};

export function StaffComplaintDeleteDialog({
  complaint,
  onClose,
  onSuccess,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();

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

  const deleteMut = useMutation({
    mutationFn: () => deleteComplaint(complaint.id),
    onSuccess: () => {
      toast.success("Complaint deleted.");
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.removeQueries({
        queryKey: laboratoryQueryKeys.complaint(complaint.id),
      });
      onSuccess();
      onClose();
    },
    onError: toastApiError,
  });

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
        className="relative z-10 flex w-full max-w-md flex-col rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Delete complaint
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

        <div className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this complaint? This cannot be undone.
          </p>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={deleteMut.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteMut.mutate()}
            >
              {deleteMut.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
