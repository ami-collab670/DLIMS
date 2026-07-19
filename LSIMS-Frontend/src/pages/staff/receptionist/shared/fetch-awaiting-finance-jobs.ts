import { fetchJobOrders } from "@/features/jobs/api";
import type { JobOrder } from "@/types/laboratory";

/** Jobs waiting on finance clearance (pending_finance + legacy submitted). */
export async function fetchAwaitingFinanceJobs(): Promise<JobOrder[]> {
  const [pending, legacy] = await Promise.all([
    fetchJobOrders({
      page: 1,
      current_status: "pending_finance",
      is_cancelled: false,
    }),
    fetchJobOrders({
      page: 1,
      current_status: "submitted",
      is_cancelled: false,
    }),
  ]);
  const seen = new Set<string>();
  const results: JobOrder[] = [];
  for (const j of pending.results) {
    if (!seen.has(j.id)) {
      seen.add(j.id);
      results.push(j);
    }
  }
  for (const j of legacy.results) {
    if (!seen.has(j.id)) {
      seen.add(j.id);
      results.push(j);
    }
  }
  return results;
}
