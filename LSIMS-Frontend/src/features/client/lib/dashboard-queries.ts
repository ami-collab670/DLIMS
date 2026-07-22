import { fetchJobOrders } from "@/features/jobs/api";
import { fetchSamples } from "@/features/laboratory/api";
import { fetchAllFinancialRecords } from "@/features/laboratory/lib/fetch-all-financial-records";
import type { FinancialRecord, JobOrder, SampleRecord } from "@/types/laboratory";

const MAX_ACTIVE_JOBS = 200;
const MAX_FINANCIAL_RECORDS = 200;
const PAGE_SIZE = 50;

export async function fetchAllActiveJobs(): Promise<JobOrder[]> {
  const jobs: JobOrder[] = [];
  let page = 1;
  let total = Infinity;

  while (jobs.length < total && jobs.length < MAX_ACTIVE_JOBS) {
    const data = await fetchJobOrders({
      page,
      page_size: PAGE_SIZE,
      is_cancelled: false,
      ordering: "-updated_at",
    });
    total = data.count;
    jobs.push(...data.results);
    if (!data.next || data.results.length === 0) break;
    page += 1;
  }

  return jobs.slice(0, MAX_ACTIVE_JOBS);
}

export async function fetchClientFinancialRecords(): Promise<FinancialRecord[]> {
  return fetchAllFinancialRecords({ maxRecords: MAX_FINANCIAL_RECORDS });
}

export async function fetchRecentSamples(limit = 5): Promise<SampleRecord[]> {
  const data = await fetchSamples({ page: 1, page_size: limit });
  return data.results;
}
