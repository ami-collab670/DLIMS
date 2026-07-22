import { fetchJobOrders } from "@/features/jobs/api";
import type { JobOrder } from "@/types/laboratory";

/** Jobs API has no client filter — load pages and filter client-side (frontend-only). */
export async function fetchAllJobOrdersForClientIndex(): Promise<JobOrder[]> {
  const first = await fetchJobOrders({ page: 1, page_size: 100, is_cancelled: false });
  const all = [...first.results];
  const totalPages = Math.ceil(first.count / 100);
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetchJobOrders({ page: i + 2, page_size: 100, is_cancelled: false }),
      ),
    );
    for (const page of rest) {
      all.push(...page.results);
    }
  }
  return all;
}
