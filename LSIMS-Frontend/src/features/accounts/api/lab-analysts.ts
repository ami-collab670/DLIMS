import { apiClient } from "@/api/client";
import type { AdminUserRow } from "@/types/account-admin";

/** Non-paginated list — admin or receptionist only. */
export async function fetchLabAnalysts(): Promise<AdminUserRow[]> {
  const { data } = await apiClient.get<AdminUserRow[]>(
    "/api/accounts/analysts/",
  );
  return data;
}
