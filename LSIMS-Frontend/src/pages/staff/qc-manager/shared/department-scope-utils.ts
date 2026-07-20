import { fetchJobOrders } from "@/features/jobs/api";
import type { ComplaintRecord, PriorityAlert } from "@/types/laboratory";

const ACTIVE_JOB_STATUSES = [
  "pending_finance",
  "received",
  "in_prep",
  "in_analysis",
  "qc",
  "finance_hold",
  "completed",
] as const;

const PAGE_SIZE = 50;

export type DepartmentTeamMember = {
  email: string;
  roleHint: string;
};

export async function fetchDepartmentJobIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const status of ACTIVE_JOB_STATUSES) {
    let page = 1;
    let total = Infinity;
    while ((page - 1) * PAGE_SIZE < total) {
      const data = await fetchJobOrders({
        page,
        page_size: PAGE_SIZE,
        current_status: status,
        is_cancelled: false,
      });
      total = data.count;
      for (const job of data.results) {
        ids.add(job.id);
      }
      if (!data.next) break;
      page += 1;
    }
  }
  return ids;
}

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
