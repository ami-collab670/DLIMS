import { apiClient } from "@/api/client";
import type { DrfPaginated, JobOrder } from "@/types/laboratory";

export type JobOrderListParams = {
  page?: number;
  search?: string;
  current_status?: string;
  priority?: string;
  /** Pass false to see only active jobs */
  is_cancelled?: boolean;
  /** DRF ordering, e.g. `-created_at` or `priority` */
  ordering?: string;
};

function buildListParams(p: JobOrderListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (p.page != null && p.page > 0) out.page = p.page;
  if (p.search?.trim()) out.search = p.search.trim();
  if (p.current_status) out.current_status = p.current_status;
  if (p.priority) out.priority = p.priority;
  if (typeof p.is_cancelled === "boolean") {
    out.is_cancelled = p.is_cancelled ? "true" : "false";
  }
  if (p.ordering?.trim()) out.ordering = p.ordering.trim();
  return out;
}

export async function fetchJobOrders(
  params: JobOrderListParams = {},
): Promise<DrfPaginated<JobOrder>> {
  const { data } = await apiClient.get<DrfPaginated<JobOrder>>(
    "/api/laboratory/jobs/",
    { params: buildListParams(params) },
  );
  return data;
}

export async function fetchJobOrder(id: string): Promise<JobOrder> {
  const { data } = await apiClient.get<JobOrder>(`/api/laboratory/jobs/${id}/`);
  return data;
}

export type CreateClientJobRequestSample = {
  sample_name: string;
  notes?: string;
  packaging_type?: string;
  sample_weight?: string | null;
  collection_date?: string | null;
};

export type CreateClientJobRequestBody = {
  description: string;
  priority: string;
  /** Pre-registers sample rows (optional). Omit for description-only legacy requests. */
  samples?: CreateClientJobRequestSample[];
};

/** External client self-service: POST { description, priority } */
export async function createClientJobRequest(
  body: CreateClientJobRequestBody,
): Promise<JobOrder> {
  const { data } = await apiClient.post<JobOrder>("/api/laboratory/jobs/", body);
  return data;
}

/** Receptionist intake — job starts in `received`. */
export type CreateStaffJobBody = {
  /** Client account email (API accepts legacy user UUID as well). */
  client: string;
  current_status: "received";
  priority: string;
  description: string;
};

export async function createStaffJob(body: CreateStaffJobBody): Promise<JobOrder> {
  const { data } = await apiClient.post<JobOrder>("/api/laboratory/jobs/", body);
  return data;
}

export type PatchJobBody = Partial<{
  /** Client account email (API accepts legacy user UUID as well). */
  client: string;
  current_status: string;
  status_reason: string;
  blocked_by_role: string | null;
  priority: string;
  description: string;
  is_cancelled: boolean;
  cancellation_reason: string;
}>;

export async function patchJobOrder(
  id: string,
  body: PatchJobBody,
): Promise<JobOrder> {
  const { data } = await apiClient.patch<JobOrder>(
    `/api/laboratory/jobs/${id}/`,
    body,
  );
  return data;
}

export async function softCancelJobOrder(id: string): Promise<void> {
  await apiClient.delete(`/api/laboratory/jobs/${id}/`);
}

export type CancelJobOrderOptions = {
  cancellation_reason?: string;
};

/** Soft-cancel with optional reason (PATCH) or bare DELETE when no reason. */
export async function cancelJobOrder(
  id: string,
  options: CancelJobOrderOptions = {},
): Promise<void> {
  const reason = options.cancellation_reason?.trim();
  if (reason) {
    await patchJobOrder(id, {
      is_cancelled: true,
      cancellation_reason: reason,
    });
    return;
  }
  await softCancelJobOrder(id);
}
