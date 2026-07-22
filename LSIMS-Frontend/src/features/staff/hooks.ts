import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { fetchLabClients } from "@/features/accounts/api";
import {
  fetchComplaints,
  fetchDiscountApprovals,
  fetchFinancialRecords,
  fetchSamples,
} from "@/features/laboratory/api";
import { fetchAwaitingFinanceJobs } from "@/features/laboratory/lib/fetch-awaiting-finance-jobs";
import { fetchDepartmentAnalystDirectory } from "@/features/staff/lib/fetch-department-analyst-directory";
import { fetchDepartmentLabTechDirectory } from "@/features/staff/lib/fetch-department-lab-tech-directory";
import { staffQueryKeys } from "@/features/staff/query-keys";
import { fetchUnreadNotificationCount } from "@/features/notifications/api";
import { isToday } from "@/lib/formatting";
import {
  needsPaymentAttention,
} from "@/lib/laboratory/finance/dashboard-metrics";
import type { DepartmentAnalystOption } from "@/lib/staff/qc-manager/analyst-directory";
import type { DepartmentLabTechOption } from "@/lib/staff/qc-manager/lab-tech-directory";

const DEFAULT_STALE_MS = 60_000;

export function useDepartmentAnalystDirectory(
  departmentId: string | null,
  options?: Omit<
    UseQueryOptions<DepartmentAnalystOption[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: staffQueryKeys.departmentAnalystDirectory(departmentId),
    queryFn: () => fetchDepartmentAnalystDirectory(departmentId),
    staleTime: 120_000,
    ...options,
  });
}

export function useDepartmentLabTechDirectory(
  departmentId: string | null,
  options?: Omit<
    UseQueryOptions<DepartmentLabTechOption[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: staffQueryKeys.departmentLabTechDirectory(departmentId),
    queryFn: () => fetchDepartmentLabTechDirectory(departmentId),
    staleTime: 120_000,
    ...options,
  });
}

export type ReceptionistDashboardKpis = {
  pendingFinance: number;
  awaitingPayment: number;
  todaysSamples: number;
  unreadNotifications: number;
  openComplaints: number;
  activeClients: number;
  pendingDiscounts: number;
};

export function useReceptionistDashboardKpis(
  options?: Omit<
    UseQueryOptions<ReceptionistDashboardKpis>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: staffQueryKeys.receptionistDashboardKpis(),
    queryFn: async () => {
      const [
        awaitingJobs,
        financialData,
        samplesData,
        unreadCount,
        complaintsData,
        clients,
        discountsData,
      ] = await Promise.all([
        fetchAwaitingFinanceJobs(),
        fetchFinancialRecords({ page: 1 }),
        fetchSamples({ page: 1, page_size: 100 }),
        fetchUnreadNotificationCount(),
        fetchComplaints({ page: 1, status: "open" }),
        fetchLabClients(),
        fetchDiscountApprovals({ page: 1, status: "pending" }),
      ]);

      const invoiceByJob = new Map<string, { payment_status: string }>();
      for (const r of financialData.results) {
        if (!invoiceByJob.has(r.job)) {
          invoiceByJob.set(r.job, { payment_status: r.payment_status });
        }
      }

      const awaitingPayment = awaitingJobs.filter((j) =>
        needsPaymentAttention(j.id, invoiceByJob),
      ).length;

      const todaysSamples = samplesData.results.filter((s) =>
        isToday(s.created_at),
      ).length;

      return {
        pendingFinance: awaitingJobs.length,
        awaitingPayment,
        todaysSamples,
        unreadNotifications: unreadCount,
        openComplaints: complaintsData.count,
        activeClients: clients.length,
        pendingDiscounts: discountsData.count,
      };
    },
    staleTime: DEFAULT_STALE_MS,
    ...options,
  });
}
