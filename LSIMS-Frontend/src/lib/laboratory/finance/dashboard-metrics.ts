import { daysSince, isToday, isWithinDays, parseMoney } from "@/lib/formatting";
import type { FinancialRecord } from "@/types/laboratory";

export function needsPaymentAttention(
  jobId: string,
  invoiceByJob: Map<string, { payment_status: string }>,
): boolean {
  const invoice = invoiceByJob.get(jobId);
  if (!invoice) return true;
  return invoice.payment_status !== "paid";
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

/** Full reports page: waivers where payment was not required. */
export function waiverMetricsNonPaymentRequired(records: FinancialRecord[]): {
  count: number;
  amount: number;
} {
  let count = 0;
  let amount = 0;
  for (const r of records) {
    if (!r.payment_required && r.waiver_approved_at) {
      count += 1;
      amount += parseMoney(r.amount_expected);
    }
  }
  return { count, amount };
}

/** Sum of all amount_paid across records (all-time, not windowed). */
export function sumAmountPaid(records: FinancialRecord[]): number {
  let total = 0;
  for (const r of records) {
    total += parseMoney(r.amount_paid);
  }
  return total;
}

export function avgIntakeToPaidDays(
  records: FinancialRecord[],
  jobCreatedAt: Map<string, string>,
): number | null {
  const intakeToPaidDays: number[] = [];

  for (const r of records) {
    if (r.payment_status === "paid" && r.paid_at) {
      const created = jobCreatedAt.get(r.job);
      if (created) {
        const days =
          (new Date(r.paid_at).getTime() - new Date(created).getTime()) /
          (1000 * 60 * 60 * 24);
        if (Number.isFinite(days) && days >= 0) {
          intakeToPaidDays.push(days);
        }
      }
    }
  }

  if (intakeToPaidDays.length === 0) return null;
  return intakeToPaidDays.reduce((a, b) => a + b, 0) / intakeToPaidDays.length;
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
