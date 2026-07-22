import type { AuthUser } from "@/types/auth";

import { isToday } from "@/lib/formatting";
import { isQcManager, isStaffAdmin } from "@/lib/staff";
import type { AnalysisResult, QCDecision } from "@/types/laboratory";

export type QcInboxSortMode = "oldest" | "priority";

export function canReviewAnalysisResults(user: AuthUser | null): boolean {
  return isStaffAdmin(user) || isQcManager(user);
}

export function requireRejectReason(reason: string): boolean {
  return reason.trim().length > 0;
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
