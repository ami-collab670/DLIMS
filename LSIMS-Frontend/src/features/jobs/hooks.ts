import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchClientServiceCatalog } from "@/features/laboratory/api";
import {
  cancelJobOrder,
  createClientJobRequest,
  createStaffJob,
  fetchJobOrder,
  fetchJobOrders,
  fetchJobResultSummary,
  patchJobOrder,
  type CreateClientJobRequestBody,
  type CreateStaffJobBody,
  type JobOrderListParams,
  type PatchJobBody,
} from "@/features/jobs/api";
import {
  CLIENT_SERVICE_CATALOG_QUERY_KEY,
  jobKeys,
} from "@/features/jobs/query-keys";
import { getApiErrorMessage } from "@/lib/api";
import type { DrfPaginated, JobOrder, JobResultSummary } from "@/types/laboratory";

const DEFAULT_LIST_STALE_MS = 30_000;
const CLIENT_CATALOG_STALE_MS = 120_000;

function useInvalidateJobs() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: jobKeys.all });
  };
}

export function useJobOrders(
  params: JobOrderListParams = {},
  options?: Omit<
    UseQueryOptions<DrfPaginated<JobOrder>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => fetchJobOrders(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useJobOrder(
  id: string,
  options?: Omit<UseQueryOptions<JobOrder>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => fetchJobOrder(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useJobResultSummary(
  jobId: string,
  options?: Omit<UseQueryOptions<JobResultSummary>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: jobKeys.resultSummary(jobId),
    queryFn: () => fetchJobResultSummary(jobId),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useClientServiceCatalog(
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof fetchClientServiceCatalog>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: CLIENT_SERVICE_CATALOG_QUERY_KEY,
    queryFn: fetchClientServiceCatalog,
    staleTime: CLIENT_CATALOG_STALE_MS,
    ...options,
  });
}

export function useCreateClientJobRequest(options?: {
  onSuccess?: (job: JobOrder) => void;
}) {
  const queryClient = useQueryClient();
  const invalidateJobs = useInvalidateJobs();

  return useMutation({
    mutationFn: (body: CreateClientJobRequestBody) => createClientJobRequest(body),
    onSuccess: (job) => {
      toast.success(
        "Request received. Finance will review it; once approved it moves to the laboratory.",
      );
      void queryClient.invalidateQueries({ queryKey: ["client-job-orders"] });
      invalidateJobs();
      options?.onSuccess?.(job);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCreateStaffJob(options?: { onSuccess?: (job: JobOrder) => void }) {
  const invalidate = useInvalidateJobs();

  return useMutation({
    mutationFn: (body: CreateStaffJobBody) => createStaffJob(body),
    onSuccess: (job) => {
      invalidate();
      options?.onSuccess?.(job);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchJobOrder(options?: { onSuccess?: (job: JobOrder) => void }) {
  const invalidate = useInvalidateJobs();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchJobBody }) =>
      patchJobOrder(id, body),
    onSuccess: (job) => {
      invalidate();
      options?.onSuccess?.(job);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCancelJobOrder(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateJobs();

  return useMutation({
    mutationFn: (id: string) => cancelJobOrder(id),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
