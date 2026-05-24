import { apiClient } from "@/api/client";
<<<<<<< HEAD
import { adminChangeUserPassword } from "@/features/accounts/admin-api";
import { useAuthStore } from "@/stores/auth-store";
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
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
<<<<<<< HEAD

export async function replaceProfile(
  payload: ProfileUpdatePayload,
): Promise<AuthUser> {
  const { data } = await apiClient.put<AuthUser>(
    "/api/accounts/profile/",
    payload,
  );
  return data;
}

/** Admin/superuser only — uses `POST /api/accounts/users/:id/change-password/`. */
export async function changeOwnPasswordAsAdmin(
  newPassword: string,
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error("Not signed in.");
  }
  await adminChangeUserPassword(userId, newPassword);
}
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
