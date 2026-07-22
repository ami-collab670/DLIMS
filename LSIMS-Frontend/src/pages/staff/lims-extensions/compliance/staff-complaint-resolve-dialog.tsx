import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveComplaint } from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import type { ComplaintRecord } from "@/types/laboratory";

import { toastApiError } from "@/lib/api/toast-api-error";

type Props = {
  complaint: ComplaintRecord;
  onClose: () => void;
  onSuccess: (updated: ComplaintRecord) => void;
};

export function StaffComplaintResolveDialog({
  complaint,
  onClose,
  onSuccess,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState("");
  const [resolutionError, setResolutionError] = useState<string | null>(null);

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

  const resolveMut = useMutation({
    mutationFn: () => resolveComplaint(complaint.id, { resolution: resolution.trim() }),
    onSuccess: (updated) => {
      toast.success("Complaint resolved.");
      queryClient.setQueryData(laboratoryQueryKeys.complaint(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onSuccess(updated);
      onClose();
    },
    onError: toastApiError,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolution.trim()) {
      setResolutionError("A resolution is required.");
      return;
    }
    setResolutionError(null);
    resolveMut.mutate();
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
            Resolve complaint
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
            <Label htmlFor="resolve-complaint-resolution">Resolution / outcome</Label>
            <Textarea
              id="resolve-complaint-resolution"
              rows={4}
              value={resolution}
              onChange={(e) => {
                setResolution(e.target.value);
                if (resolutionError) setResolutionError(null);
              }}
              placeholder="Describe how this complaint was resolved."
            />
            {resolutionError ? (
              <p className="text-xs text-destructive">{resolutionError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={resolveMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={resolveMut.isPending}>
              {resolveMut.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Resolving…
                </>
              ) : (
                "Mark resolved"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
