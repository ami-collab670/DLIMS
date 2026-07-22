import { isUserUuid } from "./analyst-directory";
import type { AdminUserRow } from "@/types/account-admin";
import type { PreparationRecord } from "@/types/laboratory";

export type DepartmentLabTechOption = {
  id: string;
  email: string;
};

function mergeLabTech(
  map: Map<string, DepartmentLabTechOption>,
  id: string | null | undefined,
  email: string | null | undefined,
) {
  const trimmedId = id?.trim();
  const trimmedEmail = email?.trim();
  if (!trimmedId || !trimmedEmail || !isUserUuid(trimmedId)) return;
  if (!map.has(trimmedId)) {
    map.set(trimmedId, { id: trimmedId, email: trimmedEmail });
  }
}

export function buildLabTechDirectory(
  adminUsers: AdminUserRow[],
  prepRecords: PreparationRecord[],
  userDepartmentId?: string | null,
): DepartmentLabTechOption[] {
  const map = new Map<string, DepartmentLabTechOption>();

  for (const row of adminUsers) {
    if (userDepartmentId && row.department !== userDepartmentId) continue;
    mergeLabTech(map, row.id, row.email);
  }

  for (const row of prepRecords) {
    mergeLabTech(map, row.technician, row.technician_email);
  }

  return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
}
