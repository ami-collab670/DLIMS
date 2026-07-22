import type { RoleRecord } from "@/types/account-admin";

import { resolveRoleLabel } from "@/lib/staff";

export function JobRoleHoldBadge({
  blockedByRole,
  roles,
}: {
  blockedByRole: string | null | undefined;
  roles: RoleRecord[];
}) {
  const label = resolveRoleLabel(blockedByRole, roles);
  if (!label) return null;

  return (
    <span className="inline-flex rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
      Hold: {label}
    </span>
  );
}
