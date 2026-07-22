import { fetchFinancialRecords } from "@/features/laboratory/api";
import type { FinancialRecord } from "@/types/laboratory";

export async function fetchAllFinancialRecords(
  options?: { maxRecords?: number },
): Promise<FinancialRecord[]> {
  const maxRecords = options?.maxRecords;
  const records: FinancialRecord[] = [];
  let page = 1;
  let total = Infinity;

  while (records.length < total) {
    if (maxRecords != null && records.length >= maxRecords) break;

    const data = await fetchFinancialRecords({ page });
    total = data.count;
    records.push(...data.results);
    if (!data.next || data.results.length === 0) break;
    page += 1;
  }

  return maxRecords != null ? records.slice(0, maxRecords) : records;
}
