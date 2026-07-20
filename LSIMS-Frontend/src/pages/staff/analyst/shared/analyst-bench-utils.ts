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

export function formatAssignedAge(assignedAt: string | null | undefined): string {
  if (!assignedAt) return "—";
  const t = new Date(assignedAt).getTime();
  if (Number.isNaN(t)) return "—";
  const hours = Math.floor((Date.now() - t) / (1000 * 60 * 60));
  if (hours < 1) return "< 1 h";
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
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

export function formatSubmittedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
