import { formatSubmittedAt as formatSubmittedAtDate } from "@/lib/formatting";
import { formatAssignedAge } from "@/lib/formatting/relative-age";
import type { AnalysisResult, SampleRecord } from "@/types/laboratory";

export function filterMyAssignedSamples(
  rows: SampleRecord[],
  userId: string | undefined,
): SampleRecord[] {
  if (!userId) return [];
  return rows.filter((s) => s.assigned_analyst === userId);
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
