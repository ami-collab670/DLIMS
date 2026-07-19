import { fetchJobOrder } from "@/features/jobs/api";
import { fetchFinancialRecords } from "@/features/laboratory/financial-records-api";
import { fetchAwaitingFinanceJobs } from "@/pages/staff/receptionist/shared/fetch-awaiting-finance-jobs";
import type { FinancialRecord, JobOrder } from "@/types/laboratory";

export function parseMoney(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: number): string {
  return `${value.toFixed(2)} ETB`;
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isWithinDays(iso: string, days: number): boolean {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return d >= cutoff;
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

export async function fetchAllFinancialRecords(): Promise<FinancialRecord[]> {
  const first = await fetchFinancialRecords({ page: 1 });
  const results = [...first.results];
  let nextUrl = first.next;
  let page = 2;
  while (nextUrl) {
    const pageData = await fetchFinancialRecords({ page });
    results.push(...pageData.results);
    nextUrl = pageData.next;
    page += 1;
  }
  return results;
}

export function invoiceByJobMap(
  records: FinancialRecord[],
): Map<string, FinancialRecord> {
  const map = new Map<string, FinancialRecord>();
  for (const r of records) {
    if (!map.has(r.job)) map.set(r.job, r);
  }
  return map;
}

export function outstandingAmount(record: FinancialRecord): number {
  if (record.payment_status === "paid") return 0;
  return Math.max(parseMoney(record.amount_expected) - parseMoney(record.amount_paid), 0);
}

export function sumOutstanding(records: FinancialRecord[]): number {
  let total = 0;
  for (const r of records) {
    total += outstandingAmount(r);
  }
  return total;
}

export function revenueCollectedInDays(records: FinancialRecord[], days: number): number {
  let total = 0;
  for (const r of records) {
    if (r.paid_at && isWithinDays(r.paid_at, days)) {
      total += parseMoney(r.amount_paid);
    }
  }
  return total;
}

export function countPaidInWindow(
  records: FinancialRecord[],
  todayOnly: boolean,
): { today: number; week: number } {
  let today = 0;
  let week = 0;
  for (const r of records) {
    if (r.payment_status !== "paid" || !r.paid_at) continue;
    if (isToday(r.paid_at)) today += 1;
    if (isWithinDays(r.paid_at, 7)) week += 1;
  }
  if (todayOnly) return { today, week };
  return { today, week };
}

export function waiverMetrics(records: FinancialRecord[]): {
  count: number;
  amount: number;
} {
  let count = 0;
  let amount = 0;
  for (const r of records) {
    if (r.waiver_approved_at) {
      count += 1;
      amount += parseMoney(r.amount_expected);
    }
  }
  return { count, amount };
}

/** Merge awaiting jobs with on-demand fetches for dashboard reference labels. */
export async function buildJobOrderMap(jobIds: string[]): Promise<Map<string, JobOrder>> {
  const awaiting = await fetchAwaitingFinanceJobs();
  const map = new Map<string, JobOrder>();
  for (const j of awaiting) {
    map.set(j.id, j);
  }
  const missing = [...new Set(jobIds)].filter((id) => !map.has(id)).slice(0, 8);
  await Promise.all(
    missing.map(async (id) => {
      try {
        const job = await fetchJobOrder(id);
        map.set(id, job);
      } catch {
        /* job may be inaccessible */
      }
    }),
  );
  return map;
}

export function needsFinanceFollowUp(record: FinancialRecord): boolean {
  if (record.payment_status === "partial") return true;
  if (record.payment_status === "pending" && !record.waiver_approved_at) {
    const age = daysSince(record.created_at);
    return age != null && age >= 7;
  }
  return false;
}

export function needsWaiverReleaseCheck(record: FinancialRecord): boolean {
  if (!record.waiver_approved_at) return false;
  return (
    record.job_status === "pending_finance" ||
    (record.payment_required && record.payment_status !== "paid")
  );
}
