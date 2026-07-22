import type { AdminUserRow } from "@/types/account-admin";
import type { AnalysisResult, SampleRecord } from "@/types/laboratory";

export type DepartmentAnalystOption = {
  id: string;
  email: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUserUuid(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return UUID_RE.test(value.trim());
}

function mergeAnalyst(
  map: Map<string, DepartmentAnalystOption>,
  id: string | null | undefined,
  email: string | null | undefined,
) {
  const trimmedId = id?.trim();
  const trimmedEmail = email?.trim();
  if (!trimmedId || !trimmedEmail || !isUserUuid(trimmedId)) return;
  if (!map.has(trimmedId)) {
    map.set(trimmedId, { id: trimmedId, email: trimmedEmail });
  }
}

export function buildAnalystDirectory(
  labAnalysts: AdminUserRow[],
  analysisResults: AnalysisResult[],
  samples: SampleRecord[],
  userDepartmentId?: string | null,
): DepartmentAnalystOption[] {
  const map = new Map<string, DepartmentAnalystOption>();

  for (const analyst of labAnalysts) {
    if (userDepartmentId && analyst.department !== userDepartmentId) continue;
    mergeAnalyst(map, analyst.id, analyst.email);
  }

  for (const row of analysisResults) {
    mergeAnalyst(map, row.analyst, row.analyst_email);
  }

  for (const row of samples) {
    mergeAnalyst(map, row.assigned_analyst, row.assigned_analyst_email);
  }

  return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export function resolveInitialAnalystUserId(
  sample: {
    assigned_analyst: string | null;
    assigned_analyst_email?: string | null;
  },
  directory: DepartmentAnalystOption[],
): string {
  if (isUserUuid(sample.assigned_analyst)) {
    return sample.assigned_analyst!.trim();
  }
  const email = sample.assigned_analyst_email?.trim().toLowerCase();
  if (email) {
    const match = directory.find((a) => a.email.toLowerCase() === email);
    if (match) return match.id;
  }
  return "";
}
