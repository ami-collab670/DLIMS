import { apiClient } from "@/api/client";
import type { AdminUserRow } from "@/types/account-admin";

/** Non-paginated — admin or receptionist only. */
export async function fetchLabClients(): Promise<AdminUserRow[]> {
  const { data } = await apiClient.get<AdminUserRow[]>("/api/accounts/clients/");
  return data;
}
