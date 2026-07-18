import { fetchJobOrders } from "@/features/jobs/api";
import { JOB_PRIORITY_LABEL, JOB_STATUS_LABEL } from "@/lib/job-order-labels";
import { clientJobReferenceLabel } from "@/lib/sample-reference-display";
import {
  CLIENT_PROGRESS_STEP_LABEL,
  CLIENT_PROGRESS_STEPS,
  toClientProgressStep,
  type ClientProgressStep,
} from "@/pages/client/results/client-results-progress";
import type {
  ComplaintRecord,
  FinancialRecord,
  JobOrder,
  JobOrderStatus,
  JobPriority,
  PaymentStatus,
} from "@/types/laboratory";

const MAX_ACTIVE_JOBS = 200;
const PAGE_SIZE = 50;

export type ChartCountRow = {
  key: string;
  label: string;
  count: number;
  fill: string;
};

export type InvoiceDueRow = FinancialRecord & {
  amountDue: number;
};

export function parseMoney(value: string | null | undefined): number {
  const n = Number.parseFloat(value ?? "");
  return Number.isFinite(n) ? n : 0;
}

export function invoiceAmountDue(record: FinancialRecord): number {
  const due = parseMoney(record.amount_expected) - parseMoney(record.amount_paid);
  return due > 0 ? Math.round(due * 100) / 100 : 0;
}

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

export function countInProgressJobs(jobs: JobOrder[]): number {
  return jobs.filter(
    (j) => !j.is_cancelled && toClientProgressStep(j.current_status) === "in_progress",
  ).length;
}

export function groupJobsByStatus(
  jobs: JobOrder[],
  colorFor: (status: JobOrderStatus) => string,
): ChartCountRow[] {
  const counts = new Map<JobOrderStatus, number>();
  for (const job of jobs) {
    counts.set(job.current_status, (counts.get(job.current_status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({
      key: status,
      label: JOB_STATUS_LABEL[status] ?? status,
      count,
      fill: colorFor(status),
    }));
}

export function groupJobsByProgressStep(
  jobs: JobOrder[],
  colorFor: (step: ClientProgressStep) => string,
): ChartCountRow[] {
  const counts = new Map<ClientProgressStep, number>();
  for (const step of CLIENT_PROGRESS_STEPS) {
    counts.set(step, 0);
  }
  for (const job of jobs) {
    const step = toClientProgressStep(job.current_status);
    counts.set(step, (counts.get(step) ?? 0) + 1);
  }
  return CLIENT_PROGRESS_STEPS.map((step) => ({
    key: step,
    label: CLIENT_PROGRESS_STEP_LABEL[step],
    count: counts.get(step) ?? 0,
    fill: colorFor(step),
  })).filter((row) => row.count > 0);
}

export function groupJobsByPriority(
  jobs: JobOrder[],
  colorFor: (priority: JobPriority) => string,
): ChartCountRow[] {
  const counts = new Map<JobPriority, number>();
  for (const job of jobs) {
    counts.set(job.priority, (counts.get(job.priority) ?? 0) + 1);
  }
  return (Object.keys(JOB_PRIORITY_LABEL) as JobPriority[]).map((priority) => ({
    key: priority,
    label: JOB_PRIORITY_LABEL[priority],
    count: counts.get(priority) ?? 0,
    fill: colorFor(priority),
  })).filter((row) => row.count > 0);
}

export function jobsNeedingAttention(jobs: JobOrder[]): JobOrder[] {
  return jobs.filter(
    (j) =>
      !j.is_cancelled &&
      (Boolean(j.status_reason?.trim()) ||
        Boolean(j.blocked_by_role) ||
        j.current_status === "finance_hold"),
  );
}

export function groupInvoicesByPaymentStatus(
  records: FinancialRecord[],
  colorFor: (status: PaymentStatus) => string,
): ChartCountRow[] {
  const counts: Record<PaymentStatus, number> = {
    paid: 0,
    pending: 0,
    partial: 0,
  };
  for (const record of records) {
    counts[record.payment_status] += 1;
  }
  return (["paid", "pending", "partial"] as PaymentStatus[]).map((status) => ({
    key: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    count: counts[status],
    fill: colorFor(status),
  })).filter((row) => row.count > 0);
}

export function invoicesNeedingPayment(records: FinancialRecord[]): InvoiceDueRow[] {
  return records
    .filter((r) => r.payment_status !== "paid")
    .map((record) => ({ ...record, amountDue: invoiceAmountDue(record) }))
    .sort((a, b) => b.amountDue - a.amountDue);
}

export function totalOutstandingAmount(records: FinancialRecord[]): number {
  return invoicesNeedingPayment(records).reduce((sum, r) => sum + r.amountDue, 0);
}

export function countInvoicesDue(records: FinancialRecord[]): number {
  return records.filter(
    (r) => r.payment_status === "pending" || r.payment_status === "partial",
  ).length;
}

export function complaintsNeedingFollowUp(
  complaints: ComplaintRecord[],
): ComplaintRecord[] {
  return complaints.filter((c) => c.status === "open" || c.status === "in_review");
}

export function hasRecentJobActivity(jobs: JobOrder[], withinDays = 7): boolean {
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000;
  return jobs.some((j) => new Date(j.updated_at).getTime() >= cutoff);
}

export { clientJobReferenceLabel as extractClientReferenceLabel };
