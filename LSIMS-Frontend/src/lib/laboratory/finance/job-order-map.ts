import type { JobOrder } from "@/types/laboratory";

export function buildJobOrderMapFromRecords(
  awaiting: JobOrder[],
  fetchedById: JobOrder[],
): Map<string, JobOrder> {
  const map = new Map<string, JobOrder>();
  for (const job of awaiting) {
    map.set(job.id, job);
  }
  for (const job of fetchedById) {
    map.set(job.id, job);
  }
  return map;
}

export function jobIdsMissingFromMap(
  map: Map<string, JobOrder>,
  jobIds: string[],
  limit = 8,
): string[] {
  return [...new Set(jobIds)].filter((id) => !map.has(id)).slice(0, limit);
}
