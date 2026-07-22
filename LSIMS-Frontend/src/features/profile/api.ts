import { apiClient } from "@/api/client";
import type { AuthUser } from "@/types/auth";

export type ProfileUpdatePayload = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  nationality?: string;
  organization_name?: string;
  organization_type?: string;
};

export async function fetchProfile(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/api/accounts/profile/");
  return data;
}

export async function updateProfile(
  payload: ProfileUpdatePayload,
): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>(
    "/api/accounts/profile/",
    payload,
  );
  return data;
}

export async function replaceProfile(
  payload: ProfileUpdatePayload,
): Promise<AuthUser> {
  const { data } = await apiClient.put<AuthUser>(
    "/api/accounts/profile/",
    payload,
  );
  return data;
}

/** Self-service password change for the signed-in user. */
export async function changeOwnPassword(body: {
  current_password: string;
  new_password: string;
}): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>(
    "/api/accounts/profile/change-password/",
    body,
  );
  return data;
}
