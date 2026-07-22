import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import {
  approveAnalysisResult,
  approveDiscountApproval,
  assignSampleAnalyst,
  assignTestToSample,
  completePreparationRecord,
  createAnalysisResult,
  createCalibrationRecord,
  createComplaint,
  createDiscountApproval,
  createFinancialRecord,
  createPreparationRecord,
  createSample,
  createTestCatalogItem,
  deleteAnalysisResult,
  deleteCalibrationRecord,
  deleteComplaint,
  deleteDiscountApproval,
  deleteFinancialRecord,
  deletePreparationRecord,
  deleteSampleHard,
  deleteTestCatalogItem,
  fetchAnalysisResult,
  fetchAnalysisResults,
  fetchCalibrationRecord,
  fetchCalibrationRecords,
  fetchClientServiceCatalog,
  fetchComplaint,
  fetchComplaints,
  fetchDiscountApproval,
  fetchDiscountApprovals,
  fetchFinancialRecord,
  fetchFinancialRecords,
  fetchPreparationRecord,
  fetchPreparationRecords,
  fetchPriorityAlerts,
  fetchQCDecision,
  fetchQCDecisions,
  fetchSample,
  fetchSampleTest,
  fetchSampleTests,
  fetchSamples,
  fetchTestCatalog,
  fetchTestCatalogItem,
  patchAnalysisResult,
  patchCalibrationRecord,
  patchComplaint,
  patchDiscountApproval,
  patchFinancialRecord,
  patchPreparationRecord,
  patchSample,
  patchTestCatalogItem,
  rejectAnalysisResult,
  rejectComplaint,
  rejectDiscountApproval,
  removeSampleTestAssignment,
  resolveComplaint,
  startPreparationRecord,
  submitAnalysisResult,
  type CreateSampleBody,
} from "@/features/laboratory/api";
import { fetchJobOrders } from "@/features/jobs/api";
import { fetchAwaitingFinanceJobs } from "@/features/laboratory/lib/fetch-awaiting-finance-jobs";
import { buildJobOrderMap } from "@/features/laboratory/lib/build-job-order-map";
import { fetchAllFinancialRecords } from "@/features/laboratory/lib/fetch-all-financial-records";
import { fetchUrgentSampleIds } from "@/features/laboratory/lib/fetch-urgent-sample-ids";
import { invalidateFinanceWorkflowQueries } from "@/features/laboratory/lib/invalidate-finance-workflow-queries";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { fetchUnreadNotificationCount } from "@/features/notifications/api";
import { getApiErrorMessage } from "@/lib/api";
import {
  countPaidInWindow,
  invoiceByJobMap,
  needsFinanceFollowUp,
  revenueCollectedInDays,
  sumOutstanding,
} from "@/lib/laboratory/finance/dashboard-metrics";
import type { QcKpiSnapshot } from "@/lib/laboratory/qc/desk-utils";
import { computeQcKpis } from "@/lib/laboratory/qc/desk-utils";
import type {
  AnalysisResult,
  CalibrationRecord,
  ComplaintRecord,
  DiscountApproval,
  DrfPaginated,
  FinancialRecord,
  JobOrder,
  PreparationRecord,
  PriorityAlert,
  QCDecision,
  SampleRecord,
  SampleTestRow,
  TestCatalogItem,
} from "@/types/laboratory";
import { toast } from "sonner";

const DEFAULT_LIST_STALE_MS = 30_000;

function invalidateByPrefix(queryClient: ReturnType<typeof useQueryClient>, prefix: string) {
  void queryClient.invalidateQueries({ queryKey: [prefix] });
}

type TestCatalogParams = Parameters<typeof fetchTestCatalog>[0];
type SamplesParams = Parameters<typeof fetchSamples>[0];
type SampleTestsParams = Parameters<typeof fetchSampleTests>[0];
type ComplaintsParams = Parameters<typeof fetchComplaints>[0];
type FinancialRecordsParams = Parameters<typeof fetchFinancialRecords>[0];
type AnalysisResultsParams = Parameters<typeof fetchAnalysisResults>[0];
type PreparationRecordsParams = Parameters<typeof fetchPreparationRecords>[0];
type CalibrationRecordsParams = Parameters<typeof fetchCalibrationRecords>[0];
type QCDecisionsParams = Parameters<typeof fetchQCDecisions>[0];
type DiscountApprovalsParams = Parameters<typeof fetchDiscountApprovals>[0];

export function useTestCatalog(
  params?: TestCatalogParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<TestCatalogItem>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["test-catalog", params],
    queryFn: () => fetchTestCatalog(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useTestCatalogItem(
  id: string,
  options?: Omit<UseQueryOptions<TestCatalogItem>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["test-catalog", id],
    queryFn: () => fetchTestCatalogItem(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateTestCatalogItem(options?: {
  onSuccess?: (item: TestCatalogItem) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTestCatalogItem,
    onSuccess: (item) => {
      invalidateByPrefix(queryClient, "test-catalog");
      options?.onSuccess?.(item);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchTestCatalogItem(options?: {
  onSuccess?: (item: TestCatalogItem) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchTestCatalogItem>[1];
    }) => patchTestCatalogItem(id, body),
    onSuccess: (item) => {
      invalidateByPrefix(queryClient, "test-catalog");
      options?.onSuccess?.(item);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteTestCatalogItem(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTestCatalogItem,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "test-catalog");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useSamples(
  params?: SamplesParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<SampleRecord>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["samples", params],
    queryFn: () => fetchSamples(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useSample(
  id: string,
  options?: Omit<UseQueryOptions<SampleRecord>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["samples", id],
    queryFn: () => fetchSample(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateSample(options?: {
  onSuccess?: (sample: Awaited<ReturnType<typeof createSample>>) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSampleBody) => createSample(body),
    onSuccess: (sample) => {
      invalidateByPrefix(queryClient, "samples");
      options?.onSuccess?.(sample);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchSample(options?: { onSuccess?: (sample: SampleRecord) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchSample>[1];
    }) => patchSample(id, body),
    onSuccess: (sample) => {
      invalidateByPrefix(queryClient, "samples");
      options?.onSuccess?.(sample);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteSample(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSampleHard,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "samples");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useSampleTests(
  params?: SampleTestsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<SampleTestRow>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["sample-tests", params],
    queryFn: () => fetchSampleTests(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useSampleTest(
  id: string,
  options?: Omit<UseQueryOptions<SampleTestRow>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["sample-tests", id],
    queryFn: () => fetchSampleTest(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useAssignTestToSample(options?: {
  onSuccess?: (row: SampleTestRow) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignTestToSample,
    onSuccess: (row) => {
      invalidateByPrefix(queryClient, "sample-tests");
      options?.onSuccess?.(row);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRemoveSampleTestAssignment(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeSampleTestAssignment,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "sample-tests");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useAssignSampleAnalyst(options?: {
  onSuccess?: (sample: SampleRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sampleId,
      body,
    }: {
      sampleId: string;
      body: Parameters<typeof assignSampleAnalyst>[1];
    }) => assignSampleAnalyst(sampleId, body),
    onSuccess: (sample) => {
      invalidateByPrefix(queryClient, "samples");
      options?.onSuccess?.(sample);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useClientServiceCatalog(
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof fetchClientServiceCatalog>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["client-service-catalog"],
    queryFn: fetchClientServiceCatalog,
    staleTime: 120_000,
    ...options,
  });
}

export function useComplaints(
  params?: ComplaintsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<ComplaintRecord>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.complaints(params),
    queryFn: () => fetchComplaints(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useComplaint(
  id: string,
  options?: Omit<UseQueryOptions<ComplaintRecord>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.complaint(id),
    queryFn: () => fetchComplaint(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateComplaint(options?: {
  onSuccess?: (complaint: ComplaintRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComplaint,
    onSuccess: (complaint) => {
      invalidateByPrefix(queryClient, "complaints");
      options?.onSuccess?.(complaint);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchComplaint(options?: {
  onSuccess?: (complaint: ComplaintRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchComplaint>[1];
    }) => patchComplaint(id, body),
    onSuccess: (complaint) => {
      invalidateByPrefix(queryClient, "complaints");
      options?.onSuccess?.(complaint);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteComplaint(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComplaint,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "complaints");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useResolveComplaint(options?: {
  onSuccess?: (complaint: ComplaintRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof resolveComplaint>[1];
    }) => resolveComplaint(id, body),
    onSuccess: (complaint) => {
      invalidateByPrefix(queryClient, "complaints");
      options?.onSuccess?.(complaint);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRejectComplaint(options?: {
  onSuccess?: (complaint: ComplaintRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof rejectComplaint>[1];
    }) => rejectComplaint(id, body),
    onSuccess: (complaint) => {
      invalidateByPrefix(queryClient, "complaints");
      options?.onSuccess?.(complaint);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useFinancialRecords(
  params?: FinancialRecordsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<FinancialRecord>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.financialRecords(params),
    queryFn: () => fetchFinancialRecords(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useFinancialRecord(
  invoiceNo: string,
  options?: Omit<UseQueryOptions<FinancialRecord>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.financialRecord(invoiceNo),
    queryFn: () => fetchFinancialRecord(invoiceNo),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(invoiceNo),
    ...options,
  });
}

export function useCreateFinancialRecord(options?: {
  onSuccess?: (record: FinancialRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFinancialRecord,
    onSuccess: (record) => {
      invalidateFinanceWorkflowQueries(queryClient, record.job);
      options?.onSuccess?.(record);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchFinancialRecord(options?: {
  onSuccess?: (record: FinancialRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceNo,
      body,
    }: {
      invoiceNo: string;
      body: Parameters<typeof patchFinancialRecord>[1];
    }) => patchFinancialRecord(invoiceNo, body),
    onSuccess: (record) => {
      invalidateFinanceWorkflowQueries(queryClient, record.job);
      options?.onSuccess?.(record);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteFinancialRecord(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFinancialRecord,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "financial-records");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useAnalysisResults(
  params?: AnalysisResultsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<AnalysisResult>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.analysisResults(params),
    queryFn: () => fetchAnalysisResults(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useAnalysisResult(
  id: string,
  options?: Omit<UseQueryOptions<AnalysisResult>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.analysisResult(id),
    queryFn: () => fetchAnalysisResult(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateAnalysisResult(options?: {
  onSuccess?: (result: AnalysisResult) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAnalysisResult,
    onSuccess: (result) => {
      invalidateByPrefix(queryClient, "analysis-results");
      options?.onSuccess?.(result);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchAnalysisResult(options?: {
  onSuccess?: (result: AnalysisResult) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchAnalysisResult>[1];
    }) => patchAnalysisResult(id, body),
    onSuccess: (result) => {
      invalidateByPrefix(queryClient, "analysis-results");
      options?.onSuccess?.(result);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteAnalysisResult(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAnalysisResult,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "analysis-results");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useSubmitAnalysisResult(options?: {
  onSuccess?: (result: AnalysisResult) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitAnalysisResult,
    onSuccess: (result) => {
      invalidateByPrefix(queryClient, "analysis-results");
      options?.onSuccess?.(result);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useApproveAnalysisResult(options?: {
  onSuccess?: (result: AnalysisResult) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: Parameters<typeof approveAnalysisResult>[1];
    }) => approveAnalysisResult(id, body),
    onSuccess: (result) => {
      invalidateByPrefix(queryClient, "analysis-results");
      options?.onSuccess?.(result);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRejectAnalysisResult(options?: {
  onSuccess?: (result: AnalysisResult) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: Parameters<typeof rejectAnalysisResult>[1];
    }) => rejectAnalysisResult(id, body),
    onSuccess: (result) => {
      invalidateByPrefix(queryClient, "analysis-results");
      options?.onSuccess?.(result);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePreparationRecords(
  params?: PreparationRecordsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<PreparationRecord>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.preparationRecords(params),
    queryFn: () => fetchPreparationRecords(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function usePreparationRecord(
  id: string,
  options?: Omit<UseQueryOptions<PreparationRecord>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.preparationRecord(id),
    queryFn: () => fetchPreparationRecord(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreatePreparationRecord(options?: {
  onSuccess?: (record: PreparationRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPreparationRecord,
    onSuccess: (record) => {
      invalidateByPrefix(queryClient, "preparation-records");
      options?.onSuccess?.(record);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchPreparationRecord(options?: {
  onSuccess?: (record: PreparationRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchPreparationRecord>[1];
    }) => patchPreparationRecord(id, body),
    onSuccess: (record) => {
      invalidateByPrefix(queryClient, "preparation-records");
      options?.onSuccess?.(record);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeletePreparationRecord(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePreparationRecord,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "preparation-records");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useStartPreparationRecord(options?: {
  onSuccess?: (record: PreparationRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startPreparationRecord,
    onSuccess: (record) => {
      invalidateByPrefix(queryClient, "preparation-records");
      options?.onSuccess?.(record);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCompletePreparationRecord(options?: {
  onSuccess?: (record: PreparationRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: Parameters<typeof completePreparationRecord>[1];
    }) => completePreparationRecord(id, body),
    onSuccess: (record) => {
      invalidateByPrefix(queryClient, "preparation-records");
      options?.onSuccess?.(record);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCalibrationRecords(
  params?: CalibrationRecordsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<CalibrationRecord>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.calibrationRecords(params),
    queryFn: () => fetchCalibrationRecords(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useCalibrationRecord(
  id: string,
  options?: Omit<UseQueryOptions<CalibrationRecord>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["calibration-records", id],
    queryFn: () => fetchCalibrationRecord(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateCalibrationRecord(options?: {
  onSuccess?: (record: CalibrationRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCalibrationRecord,
    onSuccess: (record) => {
      invalidateByPrefix(queryClient, "calibration-records");
      options?.onSuccess?.(record);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchCalibrationRecord(options?: {
  onSuccess?: (record: CalibrationRecord) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchCalibrationRecord>[1];
    }) => patchCalibrationRecord(id, body),
    onSuccess: (record) => {
      invalidateByPrefix(queryClient, "calibration-records");
      options?.onSuccess?.(record);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteCalibrationRecord(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCalibrationRecord,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "calibration-records");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useQCDecisions(
  params?: QCDecisionsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<QCDecision>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.qcDecisions(params),
    queryFn: () => fetchQCDecisions(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useQCDecision(
  id: string,
  options?: Omit<UseQueryOptions<QCDecision>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["qc-decisions", id],
    queryFn: () => fetchQCDecision(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useDiscountApprovals(
  params?: DiscountApprovalsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<DiscountApproval>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.discountApprovals(params),
    queryFn: () => fetchDiscountApprovals(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useDiscountApproval(
  id: string,
  options?: Omit<UseQueryOptions<DiscountApproval>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["discount-approvals", id],
    queryFn: () => fetchDiscountApproval(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateDiscountApproval(options?: {
  onSuccess?: (approval: DiscountApproval) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDiscountApproval,
    onSuccess: (approval) => {
      invalidateByPrefix(queryClient, "discount-approvals");
      options?.onSuccess?.(approval);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchDiscountApproval(options?: {
  onSuccess?: (approval: DiscountApproval) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchDiscountApproval>[1];
    }) => patchDiscountApproval(id, body),
    onSuccess: (approval) => {
      invalidateByPrefix(queryClient, "discount-approvals");
      options?.onSuccess?.(approval);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteDiscountApproval(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDiscountApproval,
    onSuccess: () => {
      invalidateByPrefix(queryClient, "discount-approvals");
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useApproveDiscountApproval(options?: {
  onSuccess?: (approval: DiscountApproval) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: Parameters<typeof approveDiscountApproval>[1];
    }) => approveDiscountApproval(id, body),
    onSuccess: (approval) => {
      invalidateByPrefix(queryClient, "discount-approvals");
      options?.onSuccess?.(approval);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRejectDiscountApproval(options?: {
  onSuccess?: (approval: DiscountApproval) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: Parameters<typeof rejectDiscountApproval>[1];
    }) => rejectDiscountApproval(id, body),
    onSuccess: (approval) => {
      invalidateByPrefix(queryClient, "discount-approvals");
      options?.onSuccess?.(approval);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePriorityAlerts(
  options?: Omit<UseQueryOptions<PriorityAlert[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.priorityAlerts(),
    queryFn: fetchPriorityAlerts,
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

// --- Finance & QC desk primitives / composites ---

export function useAwaitingFinanceJobs(
  options?: Omit<UseQueryOptions<JobOrder[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.awaitingFinanceJobs(),
    queryFn: fetchAwaitingFinanceJobs,
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useAllFinancialRecords(
  options?: Omit<UseQueryOptions<FinancialRecord[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.allFinancialRecords(),
    queryFn: () => fetchAllFinancialRecords(),
    staleTime: 60_000,
    ...options,
  });
}

export function useUrgentSampleIds(
  options?: Omit<UseQueryOptions<Set<string>>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.urgentSampleIds(),
    queryFn: fetchUrgentSampleIds,
    staleTime: 120_000,
    ...options,
  });
}

export function useFinanceAwaitingClearanceQueue(
  options?: Omit<UseQueryOptions<JobOrder[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.financeAwaitingClearanceQueue(),
    queryFn: async () => {
      const [jobs, records] = await Promise.all([
        fetchAwaitingFinanceJobs(),
        fetchAllFinancialRecords(),
      ]);
      const invoiceMap = invoiceByJobMap(records);
      return jobs.filter((j) => !invoiceMap.has(j.id));
    },
    staleTime: 60_000,
    ...options,
  });
}

export type FinanceOutstandingQueueData = {
  outstanding: FinancialRecord[];
  jobMap: Map<string, JobOrder>;
};

export function useFinanceOutstandingInvoicesQueue(
  options?: Omit<
    UseQueryOptions<FinanceOutstandingQueueData>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.financeOutstandingInvoicesQueue(),
    queryFn: async () => {
      const records = await fetchAllFinancialRecords();
      const outstanding = records.filter(
        (r) => r.payment_status === "pending" || r.payment_status === "partial",
      );
      const jobMap = await buildJobOrderMap(outstanding.map((r) => r.job));
      return { outstanding, jobMap };
    },
    staleTime: 60_000,
    ...options,
  });
}

export type FinanceFollowUpQueueData = {
  followUp: FinancialRecord[];
  jobMap: Map<string, JobOrder>;
};

export function useFinanceFollowUpQueue(
  options?: Omit<UseQueryOptions<FinanceFollowUpQueueData>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.financeFollowUpQueue(),
    queryFn: async () => {
      const records = await fetchAllFinancialRecords();
      const followUp = records.filter(needsFinanceFollowUp);
      const jobMap = await buildJobOrderMap(followUp.map((r) => r.job));
      return { followUp, jobMap };
    },
    staleTime: 60_000,
    ...options,
  });
}

export type FinanceDashboardKpis = {
  awaitingFirstInvoice: number;
  outstandingTotal: number;
  paidToday: number;
  paidThisWeek: number;
  revenue7d: number;
  pendingDiscounts: number;
  unreadNotifications: number;
  financeHoldCount: number;
};

export function useFinanceDashboardKpis(
  options?: {
    userEmail?: string;
  } & Omit<UseQueryOptions<FinanceDashboardKpis>, "queryKey" | "queryFn">,
) {
  const { userEmail, ...queryOptions } = options ?? {};
  return useQuery({
    queryKey: laboratoryQueryKeys.financeDashboardKpis(userEmail),
    queryFn: async () => {
      const [awaitingJobs, allRecords, holdJobs, discountsData, unreadCount] =
        await Promise.all([
          fetchAwaitingFinanceJobs(),
          fetchAllFinancialRecords(),
          fetchJobOrders({
            page: 1,
            current_status: "finance_hold",
            is_cancelled: false,
          }),
          fetchDiscountApprovals({ page: 1, status: "pending" }),
          fetchUnreadNotificationCount(),
        ]);

      const invoiceMap = invoiceByJobMap(allRecords);
      const awaitingFirstInvoice = awaitingJobs.filter(
        (j) => !invoiceMap.has(j.id),
      ).length;
      const { today: paidToday, week: paidThisWeek } = countPaidInWindow(
        allRecords,
        true,
      );
      const revenue7d = revenueCollectedInDays(allRecords, 7);
      const email = userEmail?.toLowerCase() ?? "";
      const myPendingDiscounts = discountsData.results.filter(
        (d) => !email || !d.requested_by || d.requested_by.toLowerCase() === email,
      ).length;

      return {
        awaitingFirstInvoice,
        outstandingTotal: sumOutstanding(allRecords),
        paidToday,
        paidThisWeek,
        revenue7d,
        pendingDiscounts: myPendingDiscounts,
        unreadNotifications: unreadCount,
        financeHoldCount: holdJobs.count,
      };
    },
    staleTime: 60_000,
    ...queryOptions,
  });
}

export function useQcDeskKpis(
  options?: Omit<UseQueryOptions<QcKpiSnapshot>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: laboratoryQueryKeys.qcDeskKpis(),
    queryFn: async () => {
      const [submittedRes, decisionsRes, qcJobs] = await Promise.all([
        fetchAnalysisResults({ page: 1, page_size: 100, state: "submitted" }),
        fetchQCDecisions({ page: 1, page_size: 200 }),
        fetchJobOrders({ page: 1, current_status: "qc", is_cancelled: false }),
      ]);
      return computeQcKpis(
        submittedRes.results,
        submittedRes.count,
        decisionsRes.results,
        qcJobs.count,
      );
    },
    staleTime: 60_000,
    ...options,
  });
}

export type EnrichedQcDecision = QCDecision & {
  resultDetail?: AnalysisResult | null;
};

export function useQcHistoryEnrichedRows(
  decisions: QCDecision[] | undefined,
  options?: Omit<UseQueryOptions<EnrichedQcDecision[]>, "queryKey" | "queryFn">,
) {
  const decisionIdsKey = decisions?.map((d) => d.id).join(",") ?? "";
  return useQuery({
    queryKey: laboratoryQueryKeys.qcHistoryEnriched(decisionIdsKey),
    queryFn: async (): Promise<EnrichedQcDecision[]> => {
      const rows = decisions ?? [];
      return Promise.all(
        rows.map(async (d) => {
          try {
            const resultDetail = await fetchAnalysisResult(d.analysis_result);
            return { ...d, resultDetail };
          } catch {
            return { ...d, resultDetail: null };
          }
        }),
      );
    },
    enabled: Boolean(decisions?.length),
    staleTime: 30_000,
    ...options,
  });
}

export function useQcRejectedReasonsMap(
  resultIds: string[],
  options?: Omit<UseQueryOptions<Record<string, string>>, "queryKey" | "queryFn">,
) {
  const resultIdsKey = resultIds.join(",");
  return useQuery({
    queryKey: laboratoryQueryKeys.qcRejectedReasons(resultIdsKey),
    queryFn: async (): Promise<Record<string, string>> => {
      const map: Record<string, string> = {};
      await Promise.all(
        resultIds.map(async (id) => {
          try {
            const decisions = await fetchQCDecisions({
              analysis_result: id,
              decision: "rejected",
              page: 1,
            });
            const latest = decisions.results[0];
            if (latest?.reason) map[id] = latest.reason;
          } catch {
            /* ignore per-row failures */
          }
        }),
      );
      return map;
    },
    enabled: resultIds.length > 0,
    staleTime: 30_000,
    ...options,
  });
}
