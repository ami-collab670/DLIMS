import { fetchJobOrders } from "@/features/jobs/api";
import { fetchSamples } from "@/features/laboratory/api";
import type { JobOrder } from "@/types/laboratory";

export async function fetchUrgentSampleIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const statuses: JobOrder["current_status"][] = ["qc", "in_analysis"];

  for (const current_status of statuses) {
    const jobs = await fetchJobOrders({
      page: 1,
      page_size: 100,
      priority: "urgent",
      current_status,
      is_cancelled: false,
    });
    for (const job of jobs.results) {
      const samples = await fetchSamples({ page: 1, page_size: 100, job: job.id });
      for (const sample of samples.results) {
        ids.add(sample.id);
      }
    }
  }

  return ids;
}
