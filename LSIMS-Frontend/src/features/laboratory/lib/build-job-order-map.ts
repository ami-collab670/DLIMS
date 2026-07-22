import { fetchJobOrder } from "@/features/jobs/api";
import {
  buildJobOrderMapFromRecords,
  jobIdsMissingFromMap,
} from "@/lib/laboratory/finance/job-order-map";
import { fetchAwaitingFinanceJobs } from "@/features/laboratory/lib/fetch-awaiting-finance-jobs";
import type { JobOrder } from "@/types/laboratory";

/** Merge awaiting jobs with on-demand fetches for dashboard reference labels. */
export async function buildJobOrderMap(jobIds: string[]): Promise<Map<string, JobOrder>> {
  const awaiting = await fetchAwaitingFinanceJobs();
  const preliminaryMap = buildJobOrderMapFromRecords(awaiting, []);
  const missing = jobIdsMissingFromMap(preliminaryMap, jobIds);
  const fetchedResults = await Promise.all(
    missing.map(async (id) => {
      try {
        return await fetchJobOrder(id);
      } catch {
        return null;
      }
    }),
  );
  const fetchedById = fetchedResults.filter((job): job is JobOrder => job != null);
  return buildJobOrderMapFromRecords(awaiting, fetchedById);
}
