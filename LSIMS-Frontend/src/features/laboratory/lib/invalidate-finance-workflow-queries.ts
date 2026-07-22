import type { QueryClient } from "@tanstack/react-query";

import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";

/** Invalidate caches that depend on payment gate / job workflow. */
export function invalidateFinanceWorkflowQueries(
  queryClient: QueryClient,
  jobId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["financial-records"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-jobs-picker"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-samples"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-analyst"] });
  void queryClient.invalidateQueries({ queryKey: ["client-job-orders"] });
  void queryClient.invalidateQueries({ queryKey: ["lims-finance-awaiting"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.recentJobs });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeKpis });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeAwaitingClearance });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeOutstanding });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeRecentlyCleared });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeHoldQueue });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeDiscountTracker });
  void queryClient.invalidateQueries({ queryKey: ["finance-reports-records"] });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeAllRecords });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeReportsSnapshot });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeCompliancePreview });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeFollowUp });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.financeWaiverRelease });
  if (jobId) {
    void queryClient.invalidateQueries({
      queryKey: laboratoryQueryKeys.financialRecords({ job: jobId }),
    });
    void queryClient.invalidateQueries({ queryKey: ["staff-job-order", jobId] });
  }
}
