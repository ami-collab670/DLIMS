import { apiClient } from "@/api/client";
import type { DrfPaginated } from "@/types/laboratory";
import type {
  AnalysisResult,
  AnalysisResultState,
} from "@/types/laboratory";

const BASE = "/api/laboratory/analysis-results/";

export async function fetchAnalysisResults(params?: {
  page?: number;
  search?: string;
  state?: AnalysisResultState;
  sample?: string;
  sample_test?: string;
}): Promise<DrfPaginated<AnalysisResult>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.state) query.state = params.state;
  if (params?.sample) query.sample = params.sample;
  if (params?.sample_test) query.sample_test = params.sample_test;
  const { data } = await apiClient.get<DrfPaginated<AnalysisResult>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchAnalysisResult(id: string): Promise<AnalysisResult> {
  const { data } = await apiClient.get<AnalysisResult>(`${BASE}${id}/`);
  return data;
}

export async function createAnalysisResult(body: {
  sample_test: string;
  value?: string;
  unit?: string;
  method?: string;
  remarks?: string;
}): Promise<AnalysisResult> {
  const { data } = await apiClient.post<AnalysisResult>(BASE, body);
  return data;
}

export async function patchAnalysisResult(
  id: string,
  body: Partial<{
    value: string;
    unit: string;
    method: string;
    remarks: string;
  }>,
): Promise<AnalysisResult> {
  const { data } = await apiClient.patch<AnalysisResult>(`${BASE}${id}/`, body);
  return data;
}

export async function deleteAnalysisResult(id: string): Promise<void> {
  await apiClient.delete(`${BASE}${id}/`);
}

export async function submitAnalysisResult(id: string): Promise<AnalysisResult> {
  const { data } = await apiClient.post<AnalysisResult>(`${BASE}${id}/submit/`);
  return data;
}

export async function approveAnalysisResult(
  id: string,
  body?: { reason?: string },
): Promise<AnalysisResult> {
  const { data } = await apiClient.post<AnalysisResult>(
    `${BASE}${id}/approve/`,
    body ?? {},
  );
  return data;
}

export async function rejectAnalysisResult(
  id: string,
  body?: { reason?: string },
): Promise<AnalysisResult> {
  const { data } = await apiClient.post<AnalysisResult>(
    `${BASE}${id}/reject/`,
    body ?? {},
  );
  return data;
}
