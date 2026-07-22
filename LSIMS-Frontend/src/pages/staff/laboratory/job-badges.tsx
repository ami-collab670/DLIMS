import {
  JOB_PRIORITY_LABEL,
  JOB_STATUS_LABEL,
} from "@/lib/laboratory";
import { jobPriorityToneClass } from "@/lib/laboratory/badges/job-priority-tones";
import { jobStatusToneClass } from "@/lib/laboratory/badges/job-status-tones";
import { cn } from "@/lib/ui";
import type { JobOrderStatus, JobPriority } from "@/types/laboratory";

export function LaboratoryStatusBadge({ status }: { status: string }) {
  const label =
    JOB_STATUS_LABEL[status as JobOrderStatus] ?? status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        jobStatusToneClass(status),
      )}
    >
      {label}
    </span>
  );
}

export function LaboratoryPriorityBadge({ priority }: { priority: string }) {
  const label =
    JOB_PRIORITY_LABEL[priority as JobPriority] ?? priority;

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        jobPriorityToneClass(priority),
      )}
    >
      {label}
    </span>
  );
}
