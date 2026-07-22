import { apiClient } from "@/api/client";
import type {
  DiscountApproval,
  DiscountApprovalStatus,
  DiscountType,
  DrfPaginated,
} from "@/types/laboratory";

const BASE = "/api/laboratory/discount-approvals/";

export async function fetchDiscountApprovals(params?: {
  page?: number;
  search?: string;
  status?: DiscountApprovalStatus;
  job?: string;
}): Promise<DrfPaginated<DiscountApproval>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.status) query.status = params.status;
  if (params?.job) query.job = params.job;
  const { data } = await apiClient.get<DrfPaginated<DiscountApproval>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchDiscountApproval(id: string): Promise<DiscountApproval> {
  const { data } = await apiClient.get<DiscountApproval>(`${BASE}${id}/`);
  return data;
}

export async function createDiscountApproval(body: {
  job: string;
  discount_type: DiscountType;
  percentage?: string | null;
  amount?: string | null;
  reason: string;
}): Promise<DiscountApproval> {
  const { data } = await apiClient.post<DiscountApproval>(BASE, body);
  return data;
}

export async function patchDiscountApproval(
  id: string,
  body: Partial<{
    discount_type: DiscountType;
    percentage: string | null;
    amount: string | null;
    reason: string;
  }>,
): Promise<DiscountApproval> {
  const { data } = await apiClient.patch<DiscountApproval>(`${BASE}${id}/`, body);
  return data;
}

export async function deleteDiscountApproval(id: string): Promise<void> {
  await apiClient.delete(`${BASE}${id}/`);
}

export async function approveDiscountApproval(
  id: string,
  body?: { review_note?: string },
): Promise<DiscountApproval> {
  const { data } = await apiClient.post<DiscountApproval>(
    `${BASE}${id}/approve/`,
    body ?? {},
  );
  return data;
}

export async function rejectDiscountApproval(
  id: string,
  body?: { review_note?: string },
): Promise<DiscountApproval> {
  const { data } = await apiClient.post<DiscountApproval>(
    `${BASE}${id}/reject/`,
    body ?? {},
  );
  return data;
}
