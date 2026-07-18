import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { patchComplaint } from "@/features/laboratory/complaints-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { cn } from "@/lib/utils";
import type { ComplaintCategory, ComplaintRecord } from "@/types/laboratory";

import { toastApiError } from "./staff-complaint-api-error";
import {
  COMPLAINT_CATEGORY_OPTIONS,
  COMPLAINT_DESCRIPTION_MIN_LENGTH,
} from "./constants";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

type Props = {
  complaint: ComplaintRecord;
  onClose: () => void;
  onSuccess: (updated: ComplaintRecord) => void;
};

export function StaffComplaintEditDialog({ complaint, onClose, onSuccess }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();

  const [category, setCategory] = useState(complaint.category);
  const [description, setDescription] = useState(complaint.description);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

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

  const editMut = useMutation({
    mutationFn: () => {
      const patch: Partial<{ category: ComplaintCategory; description: string }> =
        {};
      if (category !== complaint.category) patch.category = category;
      if (description.trim() !== complaint.description.trim()) {
        patch.description = description.trim();
      }
      if (Object.keys(patch).length === 0) {
        return Promise.resolve(complaint);
      }
      return patchComplaint(complaint.id, patch);
    },
    onSuccess: (updated) => {
      toast.success("Complaint updated.");
      queryClient.setQueryData(laboratoryQueryKeys.complaint(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onSuccess(updated);
      onClose();
    },
    onError: toastApiError,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setDescriptionError("Description is required.");
      return;
    }
    if (trimmed.length < COMPLAINT_DESCRIPTION_MIN_LENGTH) {
      setDescriptionError(
        `Please enter at least ${COMPLAINT_DESCRIPTION_MIN_LENGTH} characters.`,
      );
      return;
    }
    setDescriptionError(null);
    editMut.mutate();
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
        className="relative z-10 flex max-h-[min(90vh,560px)] w-full max-w-lg flex-col rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Edit complaint
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
            <Label htmlFor="edit-complaint-category">Category</Label>
            <select
              id="edit-complaint-category"
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
            >
              {COMPLAINT_CATEGORY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-complaint-description">Description</Label>
            <Textarea
              id="edit-complaint-description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (descriptionError) setDescriptionError(null);
              }}
            />
            {descriptionError ? (
              <p className="text-xs text-destructive">{descriptionError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={editMut.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={editMut.isPending}>
              {editMut.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
