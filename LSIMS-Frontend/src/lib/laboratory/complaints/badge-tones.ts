import type { ComplaintStatus } from "@/types/laboratory";

export function complaintStatusToneClass(status: ComplaintStatus): string {
  return status === "resolved"
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : status === "rejected"
      ? "bg-destructive/15 text-destructive"
      : status === "in_review"
        ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
        : "bg-primary/10 text-primary";
}
