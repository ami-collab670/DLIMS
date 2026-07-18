import { cn } from "@/lib/utils";

export type ClientProgressStep = "pending_finance" | "in_progress" | "result_ready";

export const CLIENT_PROGRESS_STEP_LABEL: Record<ClientProgressStep, string> = {
  pending_finance: "Pending finance",
  in_progress: "In progress",
  result_ready: "Result ready",
};

export const CLIENT_PROGRESS_STEPS: ClientProgressStep[] = [
  "pending_finance",
  "in_progress",
  "result_ready",
];

const PENDING_FINANCE_STATUSES = new Set(["pending_finance", "finance_hold"]);
const IN_PROGRESS_STATUSES = new Set([
  "draft",
  "submitted",
  "received",
  "in_prep",
  "in_analysis",
  "qc",
]);
const RESULT_READY_STATUSES = new Set(["completed"]);

export function toClientProgressStep(status: string): ClientProgressStep {
  if (PENDING_FINANCE_STATUSES.has(status)) return "pending_finance";
  if (RESULT_READY_STATUSES.has(status)) return "result_ready";
  if (IN_PROGRESS_STATUSES.has(status)) return "in_progress";
  return "in_progress";
}

export function clientProgressStepIndex(step: ClientProgressStep): number {
  return CLIENT_PROGRESS_STEPS.indexOf(step);
}

const BADGE_CLASS: Record<ClientProgressStep, string> = {
  pending_finance: "bg-amber-500/15 text-amber-900 dark:text-amber-300",
  in_progress: "bg-primary/10 text-primary",
  result_ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

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
        BADGE_CLASS[step],
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
                isCurrent && BADGE_CLASS[step],
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

export function formatClientDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatClientDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
