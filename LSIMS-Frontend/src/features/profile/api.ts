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

export async function updateProfile(
  payload: ProfileUpdatePayload,
): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>(
    "/api/accounts/profile/",
    payload,
  );
  return data;
}
