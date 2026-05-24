import { apiClient } from "@/api/client";
import type { RoleRecord } from "@/types/account-admin";
import type { DrfPaginated } from "@/types/laboratory";

/** Backend Role.role_name choices (accounts.models.Role). */
export type RoleName =
  | "admin"
  | "receptionist"
  | "analyst"
  | "qc_manager"
  | "finance"
  | "procurement"
  | "ministry_coordinator"
  | "auditor";

const ROLES_BASE = "/api/accounts/roles/";

export async function fetchRoles(params?: {
  page?: number;
  search?: string;
}): Promise<RoleRecord[]> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();

  const { data } = await apiClient.get<DrfPaginated<RoleRecord>>(ROLES_BASE, {
    params: query,
  });
  return data.results;
}

export async function fetchRole(id: string): Promise<RoleRecord> {
  const { data } = await apiClient.get<RoleRecord>(`${ROLES_BASE}${id}/`);
  return data;
}

export type CreateRoleBody = {
  role_name: RoleName;
  contact_alias: string;
};

export async function createRole(body: CreateRoleBody): Promise<RoleRecord> {
  const { data } = await apiClient.post<RoleRecord>(ROLES_BASE, body);
  return data;
}

export async function patchRole(
  id: string,
  body: Partial<CreateRoleBody>,
): Promise<RoleRecord> {
  const { data } = await apiClient.patch<RoleRecord>(`${ROLES_BASE}${id}/`, body);
  return data;
}

export async function replaceRole(
  id: string,
  body: CreateRoleBody,
): Promise<RoleRecord> {
  const { data } = await apiClient.put<RoleRecord>(`${ROLES_BASE}${id}/`, body);
  return data;
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`${ROLES_BASE}${id}/`);
}
