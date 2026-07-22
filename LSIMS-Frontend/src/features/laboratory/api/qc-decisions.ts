import { apiClient } from "@/api/client";
import type { DrfPaginated, QCDecision, QCDecisionValue } from "@/types/laboratory";

const BASE = "/api/laboratory/qc-decisions/";

export async function fetchQCDecisions(params?: {
  page?: number;
  page_size?: number;
  analysis_result?: string;
  decision?: QCDecisionValue;
  search?: string;
}): Promise<DrfPaginated<QCDecision>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.page_size && params.page_size > 0) query.page_size = params.page_size;
  if (params?.analysis_result) query.analysis_result = params.analysis_result;
  if (params?.decision) query.decision = params.decision;
  if (params?.search?.trim()) query.search = params.search.trim();
  const { data } = await apiClient.get<DrfPaginated<QCDecision>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchQCDecision(id: string): Promise<QCDecision> {
  const { data } = await apiClient.get<QCDecision>(`${BASE}${id}/`);
  return data;
}
