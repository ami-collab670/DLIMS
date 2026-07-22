import { cn } from "@/lib/ui";
import {
  CLIENT_PROGRESS_BADGE_CLASS,
  CLIENT_PROGRESS_STEP_LABEL,
  CLIENT_PROGRESS_STEPS,
  clientProgressStepIndex,
  toClientProgressStep,
} from "@/lib/client/progress";

export function ClientProgressBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const step = toClientProgressStep(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        CLIENT_PROGRESS_BADGE_CLASS[step],
        className,
      )}
    >
      {CLIENT_PROGRESS_STEP_LABEL[step]}
    </span>
  );
}

export function ClientProgressStepper({
  status,
  isCancelled = false,
  compact = false,
  className,
}: {
  status: string;
  isCancelled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (isCancelled) {
    return (
      <span className="inline-flex rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
        Cancelled
      </span>
    );
  }

  const currentStep = toClientProgressStep(status);
  const currentIndex = clientProgressStepIndex(currentStep);

  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1",
        compact ? "text-[10px]" : "text-xs",
        className,
      )}
      aria-label="Job progress"
    >
      {CLIENT_PROGRESS_STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <li key={step} className="flex items-center gap-1">
            {index > 0 ? (
              <span
                className={cn(
                  "mx-0.5 h-px w-3 sm:w-5",
                  isComplete || isCurrent ? "bg-primary/40" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                isCurrent && CLIENT_PROGRESS_BADGE_CLASS[step],
                isComplete && "text-muted-foreground",
                isUpcoming && "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  isCurrent && "bg-current",
                  isComplete && "bg-emerald-500",
                  isUpcoming && "bg-muted-foreground/40",
                )}
                aria-hidden
              />
              <span className={compact ? "hidden sm:inline" : undefined}>
                {CLIENT_PROGRESS_STEP_LABEL[step]}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
