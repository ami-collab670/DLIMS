import { apiClient } from "@/api/client";
import type {
  AdminUserCreateResponse,
  AdminUserRow,
} from "@/types/account-admin";
import type { ApiDetailResponse } from "@/types/api-responses";
import type { DrfPaginated } from "@/types/laboratory";

export async function fetchAdminUsers(params: {
  page?: number;
  search?: string;
  user_type?: string;
  /** e.g. `analyst` — matches backend `role__role_name` */
  role_name?: string;
  is_active?: boolean;
}): Promise<DrfPaginated<AdminUserRow>> {
  const query: Record<string, string | number> = {};
  if (params.page && params.page > 0) query.page = params.page;
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.user_type) query.user_type = params.user_type;
  if (params.role_name) query.role__role_name = params.role_name;
  if (typeof params.is_active === "boolean")
    query.is_active = params.is_active ? "true" : "false";

  const { data } = await apiClient.get<DrfPaginated<AdminUserRow>>(
    "/api/accounts/users/",
    { params: query },
  );
  return data;
}

export async function fetchAdminUser(id: string): Promise<AdminUserRow> {
  const { data } = await apiClient.get<AdminUserRow>(
    `/api/accounts/users/${id}/`,
  );
  return data;
}

export type CreateAdminUserBody = {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type: "internal" | "external";
  role?: string | null;
  nationality?: string;
  organization_name?: string;
  organization_type?: string;
};

export async function createAdminUser(
  body: CreateAdminUserBody,
): Promise<AdminUserCreateResponse> {
  const { data } = await apiClient.post<AdminUserCreateResponse>(
    "/api/accounts/users/",
    body,
  );
  return data;
}

export async function deactivateAdminUser(
  userId: string,
): Promise<ApiDetailResponse> {
  const { data } = await apiClient.delete<ApiDetailResponse>(
    `/api/accounts/users/${userId}/`,
  );
  return data;
}

export type UpdateAdminUserBody = Partial<{
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: "internal" | "external";
  role: string | null;
  nationality: string;
  organization_name: string;
  organization_type: string;
  is_active: boolean;
}>;

export async function patchAdminUser(
  userId: string,
  body: UpdateAdminUserBody,
): Promise<AdminUserRow> {
  const { data } = await apiClient.patch<AdminUserRow>(
    `/api/accounts/users/${userId}/`,
    body,
  );
  return data;
}

export async function adminChangeUserPassword(
  userId: string,
  newPassword: string,
): Promise<ApiDetailResponse> {
  const { data } = await apiClient.post<ApiDetailResponse>(
    `/api/accounts/users/${userId}/change-password/`,
    { new_password: newPassword },
  );
  return data;
}

export async function fetchExternalClients(params?: {
  page?: number;
  search?: string;
}): Promise<DrfPaginated<AdminUserRow>> {
  return fetchAdminUsers({
    page: params?.page,
    search: params?.search,
    user_type: "external",
    is_active: true,
  });
}

export async function fetchAnalystUsers(params?: {
  page?: number;
}): Promise<DrfPaginated<AdminUserRow>> {
  return fetchAdminUsers({
    page: params?.page,
    user_type: "internal",
    is_active: true,
    role_name: "analyst",
  });
}
