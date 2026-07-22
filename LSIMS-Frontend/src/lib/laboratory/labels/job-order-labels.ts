import { shortId } from "@/lib/formatting/short-id";
import type { JobOrderStatus, JobPriority } from "@/types/laboratory";

export const JOB_STATUS_LABEL: Record<JobOrderStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending_finance: "Pending finance",
  received: "Received",
  in_prep: "In preparation",
  in_analysis: "In analysis",
  qc: "Quality control",
  finance_hold: "Finance hold",
  completed: "Completed",
};

export const JOB_PRIORITY_LABEL: Record<JobPriority, string> = {
  normal: "Normal",
  urgent: "Urgent",
};

export const JOB_STATUS_OPTIONS: { value: JobOrderStatus; label: string }[] = (
  Object.entries(JOB_STATUS_LABEL) as [JobOrderStatus, string][]
).map(([value, label]) => ({ value, label }));

export const JOB_PRIORITY_OPTIONS: { value: JobPriority; label: string }[] = (
  Object.entries(JOB_PRIORITY_LABEL) as [JobPriority, string][]
).map(([value, label]) => ({ value, label }));

/** Job-order display shorthand (alias for {@link shortId}). */
export const shortJobId = shortId;
