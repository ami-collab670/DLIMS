import { apiClient } from "@/api/client";
import { registerRequest } from "@/features/auth/api";
import type { AdminUserRow } from "@/types/account-admin";

/** Non-paginated — admin or receptionist only. */
export async function fetchLabClients(): Promise<AdminUserRow[]> {
  const { data } = await apiClient.get<AdminUserRow[]>("/api/accounts/clients/");
  return data;
}

export type QuickRegisterWalkInInput = {
  email: string;
  phone?: string;
  first_name: string;
  last_name?: string;
  organization_name?: string;
};

function generateDeskPassword(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const base = btoa(String.fromCharCode(...bytes))
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 14);
  return `${base}Aa1!`;
}

/** Desk walk-in registration via public register API — does not change staff session. */
export async function quickRegisterWalkInClient(
  input: QuickRegisterWalkInInput,
): Promise<AdminUserRow> {
  const password = generateDeskPassword();
  const email = input.email.trim().toLowerCase();
  const { user } = await registerRequest({
    email,
    password,
    password_confirm: password,
    first_name: input.first_name.trim(),
    last_name: input.last_name?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    organization_name: input.organization_name?.trim() || undefined,
  });
  return user as AdminUserRow;
}
