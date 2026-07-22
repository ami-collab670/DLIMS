export function jobStatusToneClass(status: string): string {
  return status === "completed"
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : status === "pending_finance"
      ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
      : status === "draft" || status === "submitted"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/10 text-primary";
}
