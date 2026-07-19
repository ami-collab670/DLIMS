import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { JobOrder } from "@/types/laboratory";

import { StaffJobIntakeWizard } from "./staff-job-intake-wizard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (job: JobOrder) => void;
  showIntakeChecklist?: boolean;
};

export function StaffJobIntakeDialog({
  open,
  onOpenChange,
  onCreated,
  showIntakeChecklist = false,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  const handleClose = useCallback(() => {
    if (submitPending) return;
    onOpenChange(false);
  }, [submitPending, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setWizardKey((k) => k + 1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={handleClose}
        disabled={submitPending}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,820px)] w-full max-w-3xl flex-col rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <h2 id={titleId} className="font-semibold tracking-tight">
            New job order
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleClose}
            disabled={submitPending}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <StaffJobIntakeWizard
            key={wizardKey}
            embedded
            showIntakeChecklist={showIntakeChecklist}
            onPendingChange={setSubmitPending}
            onViewJob={(job) => {
              onCreated(job);
              onOpenChange(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
