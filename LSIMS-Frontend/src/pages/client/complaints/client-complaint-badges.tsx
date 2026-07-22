import { complaintStatusToneClass } from "@/lib/laboratory/complaints/badge-tones";
import { cn } from "@/lib/ui";
import type { ComplaintCategory, ComplaintStatus } from "@/types/laboratory";

import {
  COMPLAINT_CATEGORY_OPTIONS,
  COMPLAINT_STATUS_LABEL,
} from "@/lib/laboratory/complaints/constants";

export function ClientComplaintStatusBadge({
  status,
}: {
  status: ComplaintStatus;
}) {
  const label = COMPLAINT_STATUS_LABEL[status] ?? status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        complaintStatusToneClass(status),
      )}
    >
      {label}
    </span>
  );
}

export function ClientComplaintCategoryBadge({
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
