import type { JobOrder } from "@/types/laboratory";

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
