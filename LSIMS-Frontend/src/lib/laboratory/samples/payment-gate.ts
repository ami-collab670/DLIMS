import type { SampleRecord } from "@/types/laboratory";

/** Job statuses that block laboratory handoff until Finance clears payment. */
const AWAITING_PAYMENT_JOB_STATUSES = new Set(["pending_finance", "finance_hold"]);

/**
 * True when the sample's parent job has not cleared the payment gate.
 * Permanent `sample_code` is assigned only after payment or waiver (backend workflow).
 */
export function isSampleAwaitingPayment(
  sample: Pick<SampleRecord, "job_status" | "sample_code">,
): boolean {
  const status = sample.job_status ?? "";
  if (AWAITING_PAYMENT_JOB_STATUSES.has(status)) return true;
  return !sample.sample_code;
}

/** Paid/coded sample with at least one assigned test — ready for dept manager analyst routing. */
export function isSampleReadyForDeptAssignment(sample: SampleRecord): boolean {
  return !isSampleAwaitingPayment(sample) && sample.sample_tests.length > 0;
}
