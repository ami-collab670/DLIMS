import {
  JOB_PRIORITY_LABEL,
  JOB_STATUS_LABEL,
} from "@/lib/job-order-labels";
import { cn } from "@/lib/utils";
import type { JobOrderStatus, JobPriority } from "@/types/laboratory";

export function ClientRequestStatusBadge({ status }: { status: string }) {
  const label =
    JOB_STATUS_LABEL[status as JobOrderStatus] ?? status.replace(/_/g, " ");
  const active =
    status === "completed"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : status === "pending_finance"
        ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
        : status === "draft" || status === "submitted"
          ? "bg-muted text-muted-foreground"
          : "bg-primary/10 text-primary";

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        active,
      )}
    >
      {label}
    </span>
  );
}

export function ClientRequestPriorityBadge({ priority }: { priority: string }) {
  const label =
    JOB_PRIORITY_LABEL[priority as JobPriority] ?? priority;
  const urgent =
    priority === "urgent"
      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
      : priority === "critical"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        urgent,
      )}
    >
      {label}
    </span>
  );
}
