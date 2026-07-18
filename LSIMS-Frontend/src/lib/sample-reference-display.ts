import {
  isStaffAnalyst,
  isStaffLabTechnician,
} from "@/lib/staff-permissions";
import type { AuthUser } from "@/types/auth";
import type { PreparationRecord, SampleRecord } from "@/types/laboratory";

const CLIENT_REFERENCE_LINE = /^Client reference ID:\s*/i;

export function extractClientReferenceLine(
  description: string | null | undefined,
): string | undefined {
  if (!description?.trim()) return undefined;
  return description.split("\n").find((line) => CLIENT_REFERENCE_LINE.test(line));
}

/** Client-facing job label from description (reference ID or fallback). */
export function parseClientReferenceId(
  description: string | null | undefined,
): string | undefined {
  const line = extractClientReferenceLine(description);
  if (!line) return undefined;
  return line.replace(CLIENT_REFERENCE_LINE, "").trim() || undefined;
}

export function clientJobReferenceLabel(
  description: string | null | undefined,
): string {
  const ref = parseClientReferenceId(description);
  if (ref) return ref;
  const trimmed = description?.trim();
  return trimmed || "Untitled request";
}

export function sanitizeJobDescriptionForStaff(
  description: string | null | undefined,
): string {
  if (!description?.trim()) return "—";
  const sanitized = description
    .split("\n")
    .filter((line) => !CLIENT_REFERENCE_LINE.test(line))
    .join("\n")
    .trim();
  return sanitized || "—";
}

export function mergeStaffJobDescriptionEdit(
  original: string | null | undefined,
  editedSanitized: string,
): string {
  const refLine = extractClientReferenceLine(original);
  const edited = editedSanitized.trim();
  if (!refLine) return edited;
  if (!edited) return refLine;
  return `${refLine}\n${edited}`;
}

export function shouldHideClientSampleNames(user: AuthUser | null): boolean {
  return isStaffAnalyst(user) || isStaffLabTechnician(user);
}

export function staffSampleDisplayCode(sample: SampleRecord): string {
  return sample.sample_code ?? sample.blind_alias_code ?? "—";
}

export function staffSampleRowLabel(
  sample: SampleRecord,
  hideNames: boolean,
): string {
  if (!hideNames && sample.sample_name?.trim()) return sample.sample_name;
  return sample.blind_alias_code ?? sample.sample_code ?? "—";
}

export function clientLabReference(sample: SampleRecord): string {
  return sample.blind_alias_code?.trim() || "Pending assignment";
}

export function staffPreparationSampleCode(record: PreparationRecord): string {
  return record.sample_code ?? record.reference_code ?? "—";
}
