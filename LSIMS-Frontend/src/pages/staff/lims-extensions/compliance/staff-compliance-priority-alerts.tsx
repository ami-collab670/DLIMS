import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchPriorityAlerts } from "@/features/laboratory/priority-alerts-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { shortJobId } from "@/lib/job-order-labels";

export function StaffCompliancePriorityAlerts() {
  const { data: alerts = [], isLoading, isError } = useQuery({
    queryKey: laboratoryQueryKeys.priorityAlerts(),
    queryFn: fetchPriorityAlerts,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading priority alerts…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load priority alerts.
      </div>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <AlertTriangle className="size-4 text-amber-600" aria-hidden />
        <h3 className="text-sm font-semibold">
          {alerts.length} priority job alert{alerts.length === 1 ? "" : "s"} need
          attention
        </h3>
        <Link
          to="/staff/scheduling"
          className="ml-auto text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          View scheduling →
        </Link>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Overdue normal-priority jobs flagged by the laboratory priority-alerts
        endpoint — separate from complaint status.
      </p>
      <ul className="space-y-2">
        {alerts.slice(0, 5).map((alert) => (
          <li
            key={alert.job}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md bg-background/80 px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs">{shortJobId(alert.job)}</span>
            <span className="text-xs uppercase text-muted-foreground">
              {alert.priority}
            </span>
            <span className="text-xs text-muted-foreground">
              {alert.age_days}d · {alert.sample_count} samples
            </span>
            <span className="w-full text-xs">{alert.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
