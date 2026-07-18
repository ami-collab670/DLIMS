import { cn } from "@/lib/utils";
import type { ComplaintCategory, ComplaintStatus } from "@/types/laboratory";

import {
  COMPLAINT_CATEGORY_OPTIONS,
  COMPLAINT_STATUS_LABEL,
} from "./constants";

export function StaffComplaintStatusBadge({
  status,
}: {
  status: ComplaintStatus;
}) {
  const label = COMPLAINT_STATUS_LABEL[status] ?? status.replace(/_/g, " ");
  const tone =
    status === "resolved"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive"
        : status === "in_review"
          ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
          : "bg-primary/10 text-primary";

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {label}
    </span>
  );
}

export function StaffComplaintCategoryBadge({
  category,
}: {
  category: ComplaintCategory;
}) {
  const label =
    COMPLAINT_CATEGORY_OPTIONS.find((o) => o.value === category)?.label ??
    category;

  return (
    <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}
