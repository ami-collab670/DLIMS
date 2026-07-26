import { formatSubmittedAt as formatSubmittedAtDate } from "@/lib/formatting";
import { formatAssignedAge } from "@/lib/formatting/relative-age";
import type { AnalysisResult, AnalysisResultState, SampleRecord } from "@/types/laboratory";

/**
 * Analyst blind list responses omit `assigned_analyst` (SampleAnalystSerializer).
 * The backend already scopes GET /samples/ to assigned_analyst=user — do not
 * re-filter on a field that is intentionally absent.
 */
function isBlindAssignedSampleList(rows: SampleRecord[]): boolean {
  return rows.length > 0 && rows.every((s) => s.assigned_analyst == null);
}

export function filterMyAssignedSamples(
  rows: SampleRecord[],
  userId: string | undefined,
): SampleRecord[] {
  if (!userId) return [];
  if (isBlindAssignedSampleList(rows)) return rows;
  return rows.filter((s) => s.assigned_analyst === userId);
}

export function findResultForSampleTest(
  results: AnalysisResult[],
  sampleTestId: string,
): AnalysisResult | undefined {
  return results.find((r) => r.sample_test === sampleTestId);
}

export function isEditableResultState(state: AnalysisResultState): boolean {
  return state === "draft" || state === "rejected";
}

export function sortAssignedSamplesOldest(rows: SampleRecord[]): SampleRecord[] {
  return [...rows].sort((a, b) => {
    const ta = a.assigned_at ? new Date(a.assigned_at).getTime() : Infinity;
    const tb = b.assigned_at ? new Date(b.assigned_at).getTime() : Infinity;
    return ta - tb;
  });
}

export { formatAssignedAge };

export function formatSubmittedAt(iso: string | null | undefined): string {
  return formatSubmittedAtDate(iso);
}

export type AnalystDeskKpis = {
  assignedSamples: number;
  draftResults: number;
  awaitingQc: number;
  needsResubmit: number;
};

export function computeAnalystKpis(
  samples: SampleRecord[],
  draftResults: AnalysisResult[],
  submittedResults: AnalysisResult[],
  rejectedResults: AnalysisResult[],
): AnalystDeskKpis {
  return {
    assignedSamples: samples.length,
    draftResults: draftResults.length,
    awaitingQc: submittedResults.length,
    needsResubmit: rejectedResults.length,
  };
}
