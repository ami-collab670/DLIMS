import type { QueryClient } from "@tanstack/react-query";

import { jobKeys } from "@/features/jobs/query-keys";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { staffQueryKeys } from "@/features/staff/query-keys";

/** Invalidate caches that depend on payment gate / job workflow. */
export function invalidateFinanceWorkflowQueries(
  queryClient: QueryClient,
  jobId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["financial-records"] });
  void queryClient.invalidateQueries({
    queryKey: laboratoryQueryKeys.allFinancialRecords(),
  });
  void queryClient.invalidateQueries({
    queryKey: laboratoryQueryKeys.awaitingFinanceJobs(),
  });
  void queryClient.invalidateQueries({
    queryKey: laboratoryQueryKeys.financeAwaitingClearanceQueue(),
  });
  void queryClient.invalidateQueries({
    queryKey: laboratoryQueryKeys.financeOutstandingInvoicesQueue(),
  });
  void queryClient.invalidateQueries({
    queryKey: laboratoryQueryKeys.financeFollowUpQueue(),
  });
  void queryClient.invalidateQueries({ queryKey: jobKeys.all });
  void queryClient.invalidateQueries({ queryKey: ["samples"] });
  void queryClient.invalidateQueries({
    queryKey: laboratoryQueryKeys.financeDashboardKpis(),
  });
  void queryClient.invalidateQueries({
    queryKey: staffQueryKeys.receptionistDashboardKpis(),
  });
  if (jobId) {
    void queryClient.invalidateQueries({
      queryKey: laboratoryQueryKeys.financialRecords({ job: jobId }),
    });
    void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
  }
}
