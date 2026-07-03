import { apiClient } from "@/api/client";
import type { DrfPaginated } from "@/types/laboratory";
import type { QCDecision } from "@/types/laboratory";

const BASE = "/api/laboratory/qc-decisions/";

export async function fetchQCDecisions(params?: {
  page?: number;
  analysis_result?: string;
}): Promise<DrfPaginated<QCDecision>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.analysis_result) query.analysis_result = params.analysis_result;
  const { data } = await apiClient.get<DrfPaginated<QCDecision>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchQCDecision(id: string): Promise<QCDecision> {
  const { data } = await apiClient.get<QCDecision>(`${BASE}${id}/`);
  return data;
}
