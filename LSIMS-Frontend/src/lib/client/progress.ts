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

export const CLIENT_PROGRESS_BADGE_CLASS: Record<ClientProgressStep, string> = {
  pending_finance: "bg-amber-500/15 text-amber-900 dark:text-amber-300",
  in_progress: "bg-primary/10 text-primary",
  result_ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};
