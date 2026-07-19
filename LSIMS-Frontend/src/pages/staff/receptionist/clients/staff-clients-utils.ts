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

export function jobsForClient(jobs: JobOrder[], clientEmail: string): JobOrder[] {
  const normalized = clientEmail.trim().toLowerCase();
  return jobs.filter((j) => j.client.trim().toLowerCase() === normalized);
}

export function jobCountByClientEmail(
  jobs: JobOrder[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const key = job.client.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function clientMatchesSearch(
  client: {
    organization_name: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    client.organization_name,
    client.email,
    client.first_name,
    client.last_name,
    client.phone,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
