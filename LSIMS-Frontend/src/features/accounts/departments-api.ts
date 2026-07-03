import { apiClient } from "@/api/client";
import type { DepartmentRecord } from "@/types/account-admin";
import type { DrfPaginated } from "@/types/laboratory";

const BASE = "/api/accounts/departments/";

export async function fetchDepartments(params?: {
  page?: number;
  search?: string;
}): Promise<DrfPaginated<DepartmentRecord>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();
  const { data } = await apiClient.get<DrfPaginated<DepartmentRecord>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchDepartment(id: string): Promise<DepartmentRecord> {
  const { data } = await apiClient.get<DepartmentRecord>(`${BASE}${id}/`);
  return data;
}

export async function createDepartment(body: {
  name: string;
  description?: string;
}): Promise<DepartmentRecord> {
  const { data } = await apiClient.post<DepartmentRecord>(BASE, body);
  return data;
}

export async function patchDepartment(
  id: string,
  body: Partial<{ name: string; description: string }>,
): Promise<DepartmentRecord> {
  const { data } = await apiClient.patch<DepartmentRecord>(`${BASE}${id}/`, body);
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`${BASE}${id}/`);
}
