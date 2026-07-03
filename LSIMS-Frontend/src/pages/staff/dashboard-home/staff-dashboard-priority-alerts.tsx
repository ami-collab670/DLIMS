import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchPriorityAlerts } from "@/features/laboratory/priority-alerts-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { shortJobId } from "@/lib/job-order-labels";

export function StaffDashboardPriorityAlerts() {
  const { data: alerts = [], isLoading, isError } = useQuery({
    queryKey: laboratoryQueryKeys.priorityAlerts(),
    queryFn: fetchPriorityAlerts,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading priority alerts…
      </div>
    );
  }

  if (isError) return null;

  if (alerts.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-600" />
        <h3 className="text-sm font-semibold">Priority alerts</h3>
        <Link
          to="/staff/scheduling"
          className="ml-auto text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          View scheduling →
        </Link>
      </div>
      <ul className="space-y-2">
        {alerts.slice(0, 5).map((a) => (
          <li
            key={a.job}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md bg-background/80 px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs">{shortJobId(a.job)}</span>
            <span className="text-xs uppercase text-muted-foreground">{a.priority}</span>
            <span className="text-xs text-muted-foreground">
              {a.age_days}d · {a.sample_count} samples
            </span>
            <span className="w-full text-xs">{a.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
