import type { ComplaintRecord, PriorityAlert } from "@/types/laboratory";

export type DepartmentTeamMember = {
  email: string;
  roleHint: string;
};

export function filterComplaintsForDepartment(
  complaints: ComplaintRecord[],
  jobIds: Set<string>,
): ComplaintRecord[] {
  return complaints.filter((c) => c.job != null && jobIds.has(c.job));
}

export function countHiddenComplaints(
  complaints: ComplaintRecord[],
  jobIds: Set<string>,
): number {
  return complaints.filter((c) => !c.job || !jobIds.has(c.job)).length;
}

export function filterPriorityAlertsForDepartment(
  alerts: PriorityAlert[],
  jobIds: Set<string>,
): PriorityAlert[] {
  return alerts.filter((a) => jobIds.has(a.job));
}

/** Exclude payment/invoice disputes — handled by Finance and Reception. */
export function filterNonPaymentComplaints(
  complaints: ComplaintRecord[],
): ComplaintRecord[] {
  return complaints.filter((c) => c.category !== "payment");
}

export function countPaymentComplaints(complaints: ComplaintRecord[]): number {
  return complaints.filter((c) => c.category === "payment").length;
}

export function buildDepartmentTeamRoster(
  samples: Array<{
    assigned_analyst?: string | null;
    assigned_analyst_email?: string | null;
  }>,
  prepRecords: Array<{ technician_email?: string | null }>,
): DepartmentTeamMember[] {
  const map = new Map<string, DepartmentTeamMember>();

  for (const sample of samples) {
    const email = sample.assigned_analyst_email?.trim();
    if (!email) continue;
    if (!map.has(email)) {
      map.set(email, { email, roleHint: "Analyst (assigned on samples)" });
    }
  }

  for (const prep of prepRecords) {
    const email = prep.technician_email?.trim();
    if (!email) continue;
    if (!map.has(email)) {
      map.set(email, { email, roleHint: "Technician (preparation)" });
    }
  }

  return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
}
