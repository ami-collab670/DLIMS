export function jobPriorityToneClass(priority: string): string {
  return priority === "urgent"
    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    : priority === "critical"
      ? "bg-destructive/15 text-destructive"
      : "bg-muted text-muted-foreground";
}
