import { fetchJobOrders } from "@/features/jobs/api";

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
