import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

import { fetchPriorityAlerts } from "@/features/laboratory/priority-alerts-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { shortJobId } from "@/lib/job-order-labels";
import { isQcManager } from "@/lib/staff-permissions";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import {
  fetchDepartmentJobIds,
  filterPriorityAlertsForDepartment,
} from "@/pages/staff/qc-manager/shared/department-scope-utils";
import { useAuthStore } from "@/stores/auth-store";

export function StaffSchedulingPriorityAlerts() {
  const user = useAuthStore((s) => s.user);
  const qcManager = isQcManager(user);

  const { data: departmentJobIds } = useQuery({
    queryKey: dashboardKeys.qcManagerJobIds,
    queryFn: fetchDepartmentJobIds,
    enabled: qcManager,
    staleTime: 120_000,
  });

  const { data: alerts = [], isLoading, isError } = useQuery({
    queryKey: laboratoryQueryKeys.priorityAlerts(),
    queryFn: fetchPriorityAlerts,
    staleTime: 60_000,
  });

  const { visibleAlerts, hiddenCount } = useMemo(() => {
    if (!departmentJobIds) {
      return { visibleAlerts: alerts, hiddenCount: 0 };
    }
    const visible = filterPriorityAlertsForDepartment(alerts, departmentJobIds);
    return { visibleAlerts: visible, hiddenCount: alerts.length - visible.length };
  }, [alerts, departmentJobIds]);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Priority alerts</h3>
      <p className="text-xs text-muted-foreground">
        Jobs flagged by the laboratory priority-alerts endpoint (age, status, sample load).
        {hiddenCount > 0
          ? ` ${hiddenCount} alert${hiddenCount === 1 ? "" : "s"} outside your department hidden.`
          : null}
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">Could not load priority alerts.</p>
        ) : visibleAlerts.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            {alerts.length > 0 && departmentJobIds
              ? "No priority alerts for jobs in your department."
              : "No priority alerts right now."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Job</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Age (days)</th>
                  <th className="px-4 py-2 font-medium">Samples</th>
                  <th className="px-4 py-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {visibleAlerts.map((a) => (
                  <tr key={a.job} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">{shortJobId(a.job)}</td>
                    <td className="px-4 py-2 uppercase">{a.priority}</td>
                    <td className="px-4 py-2 capitalize">
                      {a.current_status.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{a.age_days}</td>
                    <td className="px-4 py-2 tabular-nums">{a.sample_count}</td>
                    <td className="max-w-[280px] px-4 py-2 text-xs">{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
