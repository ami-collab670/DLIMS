import { apiClient } from "@/api/client";
import type { DrfPaginated } from "@/types/laboratory";
import type {
  ComplaintCategory,
  ComplaintRecord,
  ComplaintStatus,
} from "@/types/laboratory";

const BASE = "/api/laboratory/complaints/";

export async function fetchComplaints(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  job?: string;
}): Promise<DrfPaginated<ComplaintRecord>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.page_size && params.page_size > 0) query.page_size = params.page_size;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.status) query.status = params.status;
  if (params?.category) query.category = params.category;
  if (params?.job) query.job = params.job;
  const { data } = await apiClient.get<DrfPaginated<ComplaintRecord>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchComplaint(id: string): Promise<ComplaintRecord> {
  const { data } = await apiClient.get<ComplaintRecord>(`${BASE}${id}/`);
  return data;
}

export async function createComplaint(body: {
  client?: string;
  job?: string | null;
  sample?: string | null;
  category?: ComplaintCategory;
  description: string;
}): Promise<ComplaintRecord> {
  const { data } = await apiClient.post<ComplaintRecord>(BASE, body);
  return data;
}

export async function patchComplaint(
  id: string,
  body: Partial<{ category: ComplaintCategory; description: string }>,
): Promise<ComplaintRecord> {
  const { data } = await apiClient.patch<ComplaintRecord>(`${BASE}${id}/`, body);
  return data;
}

export async function deleteComplaint(id: string): Promise<void> {
  await apiClient.delete(`${BASE}${id}/`);
}

export async function resolveComplaint(
  id: string,
  body: { resolution: string },
): Promise<ComplaintRecord> {
  const { data } = await apiClient.post<ComplaintRecord>(
    `${BASE}${id}/resolve/`,
    body,
  );
  return data;
}

export async function rejectComplaint(
  id: string,
  body: { resolution: string },
): Promise<ComplaintRecord> {
  const { data } = await apiClient.post<ComplaintRecord>(
    `${BASE}${id}/reject/`,
    body,
  );
  return data;
}
