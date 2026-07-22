import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import {
  fetchAllActiveJobs,
  fetchClientFinancialRecords,
  fetchRecentSamples,
} from "@/features/client/lib/dashboard-queries";
import { clientKeys } from "@/features/client/query-keys";
import type { FinancialRecord, JobOrder, SampleRecord } from "@/types/laboratory";

const DEFAULT_STALE_MS = 45_000;

export function useClientActiveJobs(
  options?: Omit<UseQueryOptions<JobOrder[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: clientKeys.allActiveJobs,
    queryFn: fetchAllActiveJobs,
    staleTime: DEFAULT_STALE_MS,
    ...options,
  });
}

export function useClientFinancialRecords(
  options?: Omit<UseQueryOptions<FinancialRecord[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: clientKeys.allFinancialRecords,
    queryFn: fetchClientFinancialRecords,
    staleTime: DEFAULT_STALE_MS,
    ...options,
  });
}

export function useClientRecentSamples(
  limit = 5,
  options?: Omit<UseQueryOptions<SampleRecord[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: clientKeys.recentSamples,
    queryFn: () => fetchRecentSamples(limit),
    staleTime: DEFAULT_STALE_MS,
    ...options,
  });
}
