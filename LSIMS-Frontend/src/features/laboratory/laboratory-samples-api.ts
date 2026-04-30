import { apiClient } from "@/api/client";
import type { DrfPaginated, SampleRecord } from "@/types/laboratory";

/** Paginated samples; list is scoped by the backend to the authenticated user. */
export async function fetchSamples(params?: {
  page?: number;
  search?: string;
  job?: string;
  sample_status?: string;
}): Promise<DrfPaginated<SampleRecord>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.job) query.job = params.job;
  if (params?.sample_status) query.sample_status = params.sample_status;

  const { data } = await apiClient.get<DrfPaginated<SampleRecord>>(
    "/api/laboratory/samples/",
    { params: query },
  );
  return data;
}
