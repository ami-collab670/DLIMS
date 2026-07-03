import { apiClient } from "@/api/client";
import type { DrfPaginated } from "@/types/laboratory";
import type { PreparationRecord, PreparationStatus } from "@/types/laboratory";

const BASE = "/api/laboratory/preparation-records/";

export async function fetchPreparationRecords(params?: {
  page?: number;
  search?: string;
  status?: PreparationStatus;
  sample?: string;
  job?: string;
}): Promise<DrfPaginated<PreparationRecord>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.status) query.status = params.status;
  if (params?.sample) query.sample = params.sample;
  if (params?.job) query.job = params.job;
  const { data } = await apiClient.get<DrfPaginated<PreparationRecord>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchPreparationRecord(id: string): Promise<PreparationRecord> {
  const { data } = await apiClient.get<PreparationRecord>(`${BASE}${id}/`);
  return data;
}

export async function createPreparationRecord(body: {
  sample: string;
  technician?: string | null;
  notes?: string;
}): Promise<PreparationRecord> {
  const { data } = await apiClient.post<PreparationRecord>(BASE, body);
  return data;
}

export async function patchPreparationRecord(
  id: string,
  body: Partial<{ technician: string | null; notes: string }>,
): Promise<PreparationRecord> {
  const { data } = await apiClient.patch<PreparationRecord>(`${BASE}${id}/`, body);
  return data;
}

export async function deletePreparationRecord(id: string): Promise<void> {
  await apiClient.delete(`${BASE}${id}/`);
}

export async function startPreparationRecord(id: string): Promise<PreparationRecord> {
  const { data } = await apiClient.post<PreparationRecord>(`${BASE}${id}/start/`);
  return data;
}

export async function completePreparationRecord(
  id: string,
  body?: { preparation_data?: Record<string, unknown>; notes?: string },
): Promise<PreparationRecord> {
  const { data } = await apiClient.post<PreparationRecord>(
    `${BASE}${id}/complete/`,
    body ?? {},
  );
  return data;
}
