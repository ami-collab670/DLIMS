import { apiClient } from "@/api/client";
<<<<<<< HEAD
import type { SampleCreateResponse } from "@/types/api-responses";
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import type {
  DrfPaginated,
  SampleRecord,
  TestCatalogItem,
  SampleTestRow,
} from "@/types/laboratory";

export async function fetchTestCatalog(params?: {
  page?: number;
  search?: string;
  is_active?: boolean;
}): Promise<DrfPaginated<TestCatalogItem>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (typeof params?.is_active === "boolean")
    query.is_active = params.is_active ? "true" : "false";

  const { data } = await apiClient.get<DrfPaginated<TestCatalogItem>>(
    "/api/laboratory/tests/",
    { params: query },
  );
  return data;
}

export async function createTestCatalogItem(body: {
  test_name: string;
  test_code: string;
  description?: string;
  unit: string;
  price: string;
  is_active?: boolean;
}): Promise<TestCatalogItem> {
  const { data } = await apiClient.post<TestCatalogItem>(
    "/api/laboratory/tests/",
    body,
  );
  return data;
}

export async function patchTestCatalogItem(
  id: string,
  body: Partial<{
    test_name: string;
    test_code: string;
    description: string;
    unit: string;
    price: string;
    is_active: boolean;
  }>,
): Promise<TestCatalogItem> {
  const { data } = await apiClient.patch<TestCatalogItem>(
    `/api/laboratory/tests/${id}/`,
    body,
  );
  return data;
}

<<<<<<< HEAD
export async function fetchTestCatalogItem(id: string): Promise<TestCatalogItem> {
  const { data } = await apiClient.get<TestCatalogItem>(
    `/api/laboratory/tests/${id}/`,
  );
  return data;
}

export async function deleteTestCatalogItem(id: string): Promise<void> {
  await apiClient.delete(`/api/laboratory/tests/${id}/`);
}

=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
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

export async function fetchSample(id: string): Promise<SampleRecord> {
  const { data } = await apiClient.get<SampleRecord>(
    `/api/laboratory/samples/${id}/`,
  );
  return data;
}

export type CreateSampleBody = {
  job: string;
  sample_name: string;
  /** Client account email (API accepts legacy user UUID as well). */
  submitted_by: string;
  /** Lab analyst email, or omit (API accepts legacy user UUID as well). */
  assigned_analyst?: string | null;
  sample_weight?: string | null;
  packaging_type?: string;
  collection_date?: string | null;
  /** Default true on the API: new samples match the job's workflow stage. */
  status_sync_with_job?: boolean;
  /** Only honored when status_sync_with_job is false. */
  sample_status?: string;
  notes?: string;
};

<<<<<<< HEAD
export async function createSample(
  body: CreateSampleBody,
): Promise<SampleCreateResponse> {
  const { data } = await apiClient.post<SampleCreateResponse>(
=======
export async function createSample(body: CreateSampleBody): Promise<SampleRecord> {
  const { data } = await apiClient.post<SampleRecord>(
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
    "/api/laboratory/samples/",
    body,
  );
  return data;
}

export async function patchSample(
  id: string,
  body: Partial<{
    sample_name: string;
    sample_weight: string | null;
    packaging_type: string;
    collection_date: string | null;
    /** Analyst email or null (API accepts legacy user UUID as well). */
    assigned_analyst: string | null;
    assigned_at: string | null;
    reassigned_reason: string;
    status_sync_with_job: boolean;
    sample_status: string;
    notes: string;
  }>,
): Promise<SampleRecord> {
  const { data } = await apiClient.patch<SampleRecord>(
    `/api/laboratory/samples/${id}/`,
    body,
  );
  return data;
}

export async function deleteSampleHard(id: string): Promise<void> {
  await apiClient.delete(`/api/laboratory/samples/${id}/`);
}

export async function fetchSampleTests(params?: {
  page?: number;
  sample?: string;
  test?: string;
}): Promise<DrfPaginated<SampleTestRow>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.sample) query.sample = params.sample;
  if (params?.test) query.test = params.test;

  const { data } = await apiClient.get<DrfPaginated<SampleTestRow>>(
    "/api/laboratory/sample-tests/",
    { params: query },
  );
  return data;
}

<<<<<<< HEAD
export async function fetchSampleTest(id: string): Promise<SampleTestRow> {
  const { data } = await apiClient.get<SampleTestRow>(
    `/api/laboratory/sample-tests/${id}/`,
  );
  return data;
}

=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
export async function assignTestToSample(body: {
  sample: string;
  test: string;
}): Promise<SampleTestRow> {
  const { data } = await apiClient.post<SampleTestRow>(
    "/api/laboratory/sample-tests/",
    body,
  );
  return data;
}

export async function removeSampleTestAssignment(id: string): Promise<void> {
  await apiClient.delete(`/api/laboratory/sample-tests/${id}/`);
}
