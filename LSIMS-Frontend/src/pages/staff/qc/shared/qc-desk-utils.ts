import type { AuthUser } from "@/types/auth";

import { fetchJobOrders } from "@/features/jobs/api";
import { fetchSamples } from "@/features/laboratory/staff-api";
import { isQcManager, isStaffAdmin } from "@/lib/staff-permissions";
import type { AnalysisResult, JobOrder, QCDecision } from "@/types/laboratory";

export type QcInboxSortMode = "oldest" | "priority";

export function canReviewAnalysisResults(user: AuthUser | null): boolean {
  return isStaffAdmin(user) || isQcManager(user);
}

export function requireRejectReason(reason: string): boolean {
  return reason.trim().length > 0;
}

export function formatQueueAge(submittedAt: string | null | undefined): string {
  if (!submittedAt) return "—";
  const t = new Date(submittedAt).getTime();
  if (Number.isNaN(t)) return "—";
  const hours = Math.floor((Date.now() - t) / (1000 * 60 * 60));
  if (hours < 1) return "< 1 h";
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

export function sortSubmittedResults(
  rows: AnalysisResult[],
  mode: QcInboxSortMode,
  urgentSampleIds?: Set<string>,
): AnalysisResult[] {
  const copy = [...rows];
  if (mode === "priority" && urgentSampleIds?.size) {
    copy.sort((a, b) => {
      const aUrgent = urgentSampleIds.has(a.sample) ? 0 : 1;
      const bUrgent = urgentSampleIds.has(b.sample) ? 0 : 1;
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      return compareSubmittedOldest(a, b);
    });
    return copy;
  }
  copy.sort(compareSubmittedOldest);
  return copy;
}

function compareSubmittedOldest(a: AnalysisResult, b: AnalysisResult): number {
  const ta = a.submitted_at ? new Date(a.submitted_at).getTime() : Infinity;
  const tb = b.submitted_at ? new Date(b.submitted_at).getTime() : Infinity;
  return ta - tb;
}

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

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export type QcKpiSnapshot = {
  awaitingReview: number;
  approvedToday: number;
  rejectedToday: number;
  averageQueueHours: number | null;
  jobsInQc: number;
};

export function computeQcKpis(
  submitted: AnalysisResult[],
  submittedTotal: number,
  decisions: QCDecision[],
  qcJobsCount: number,
): QcKpiSnapshot {
  const approvedToday = decisions.filter(
    (d) => d.decision === "approved" && isToday(d.decided_at),
  ).length;
  const rejectedToday = decisions.filter(
    (d) => d.decision === "rejected" && isToday(d.decided_at),
  ).length;

  const ages = submitted
    .map((r) => (r.submitted_at ? new Date(r.submitted_at).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  const averageQueueHours =
    ages.length > 0
      ? Math.round(
          ages.reduce((sum, t) => sum + (Date.now() - t) / (1000 * 60 * 60), 0) /
            ages.length,
        )
      : null;

  return {
    awaitingReview: submittedTotal,
    approvedToday,
    rejectedToday,
    averageQueueHours,
    jobsInQc: qcJobsCount,
  };
}

export function formatSubmittedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDecidedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
