import type { RoleRecord } from "@/types/account-admin";

import { roleOptionLabel } from "./role-display";

export function resolveRoleLabel(
  roleId: string | null | undefined,
  roles: RoleRecord[],
): string | null {
  if (!roleId) return null;
  const match = roles.find((r) => r.id === roleId);
  if (match) return roleOptionLabel(match);
  return roleId;
}
