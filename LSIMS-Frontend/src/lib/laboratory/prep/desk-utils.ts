import { isToday } from "@/lib/formatting";
import type { PreparationRecord } from "@/types/laboratory";

export function isPrepAssignedToOther(
  record: PreparationRecord,
  userId: string | undefined,
): boolean {
  if (!userId || !record.technician) return false;
  return record.technician !== userId;
}

export function canClaimPrepRecord(
  record: PreparationRecord,
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  if (record.technician === userId) return true;
  return record.technician === null && record.status === "pending";
}

export function filterMyPrepRecords(
  rows: PreparationRecord[],
  userId: string | undefined,
): PreparationRecord[] {
  if (!userId) return [];
  return rows.filter((r) => {
    if (isPrepAssignedToOther(r, userId)) return false;
    return canClaimPrepRecord(r, userId);
  });
}

export { isToday };

export type LabTechDeskKpis = {
  pendingClaimable: number;
  inProgressMine: number;
  completedToday: number;
};

export function computeLabTechKpis(
  rows: PreparationRecord[],
  userId: string | undefined,
): LabTechDeskKpis {
  const visible = filterMyPrepRecords(rows, userId);
  return {
    pendingClaimable: visible.filter((r) => r.status === "pending").length,
    inProgressMine: visible.filter(
      (r) => r.status === "in_progress" && r.technician === userId,
    ).length,
    completedToday: visible.filter(
      (r) => r.status === "completed" && isToday(r.completed_at),
    ).length,
  };
}

export function sortPrepQueueOldest(rows: PreparationRecord[]): PreparationRecord[] {
  return [...rows].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return ta - tb;
  });
}

export const LAB_TECH_PREP_PAGE_SIZE = 25;
