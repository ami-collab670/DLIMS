import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/table-list-utils";
import type { ComplaintCategory, ComplaintStatus } from "@/types/laboratory";

export { DEFAULT_TABLE_PAGE_SIZE as STAFF_COMPLAINTS_PAGE_SIZE };

export const COMPLAINT_CATEGORY_OPTIONS: {
  value: ComplaintCategory;
  label: string;
}[] = [
  { value: "payment", label: "Payment / invoice" },
  { value: "sample", label: "Sample handling" },
  { value: "result", label: "Results" },
  { value: "other", label: "Other" },
];

export const COMPLAINT_STATUS_LABEL: Record<ComplaintStatus, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

export const COMPLAINT_STATUS_OPTIONS: {
  value: ComplaintStatus;
  label: string;
}[] = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export function complaintCategoryLabel(category: ComplaintCategory): string {
  return (
    COMPLAINT_CATEGORY_OPTIONS.find((o) => o.value === category)?.label ??
    category
  );
}

export function truncateComplaintTitle(description: string, max = 48): string {
  const trimmed = description.trim();
  if (!trimmed) return "Complaint";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export const COMPLAINT_DESCRIPTION_MIN_LENGTH = 10;
