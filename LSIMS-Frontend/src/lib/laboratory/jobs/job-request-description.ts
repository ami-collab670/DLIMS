import {
  formatCatalogLine,
  sumSelectedPrices,
  type ClientCatalogIndex,
  type ClientCatalogTest,
} from "@/lib/laboratory/catalog/client-catalog";

import { formatMoneyPlain } from "@/lib/formatting";

export const MAX_JOB_REQUEST_SAMPLES = 50;

export type MultiSampleMode = "uniform" | "distinct";

export function randomRefId(): string {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `JOB-REF-${hex}`;
}

export function randomConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (x) => chars[x % chars.length]).join("");
}

export function linesForSelectedIds(
  sortedIds: string[],
  index: ClientCatalogIndex,
): string[] {
  const lines: string[] = [];
  if (!sortedIds.length) {
    lines.push("(No catalog lines — staff to confirm scope.)");
    return lines;
  }
  lines.push("Selected services (indicative ETB pricing):");
  for (const id of sortedIds) {
    const test = index.get(id);
    if (!test) continue;
    lines.push(formatCatalogLine(test));
  }
  return lines;
}

export function buildJobDescription(input: {
  referenceId: string;
  priority: string;
  confirmationCode: string;
  sampleCount: number;
  multiSampleMode: MultiSampleMode;
  sampleNames: string[];
  globalNotes: string;
  perSampleNotes: string[];
  selectionGroups: { label: string; ids: string[] }[];
  catalogIndex: ClientCatalogIndex;
}): string {
  const lines: string[] = [];
  lines.push(`Client reference ID: ${input.referenceId.trim()}`);
  lines.push(`Requested priority: ${input.priority}`);
  lines.push(`Number of samples: ${input.sampleCount}`);
  lines.push(
    `Per-sample scope: ${
      input.sampleCount >= 2 && input.multiSampleMode === "distinct"
        ? "Different selections / notes per sample"
        : "Same catalog selections for all samples"
    }`,
  );
  lines.push("");
  lines.push("Sample names:");
  for (let i = 0; i < input.sampleCount; i++) {
    const nm = input.sampleNames[i]?.trim() || `Sample ${i + 1}`;
    lines.push(`  ${i + 1}. ${nm}`);
  }
  lines.push("");

  if (input.sampleCount === 1 || input.multiSampleMode === "uniform") {
    const ids = [...(input.selectionGroups[0]?.ids ?? [])].sort((a, b) => {
      const codeA = input.catalogIndex.get(a)?.test_code ?? a;
      const codeB = input.catalogIndex.get(b)?.test_code ?? b;
      return codeA.localeCompare(codeB);
    });
    lines.push(...linesForSelectedIds(ids, input.catalogIndex));
    lines.push("");
    if (input.globalNotes.trim()) {
      lines.push("Additional notes (job):");
      lines.push(input.globalNotes.trim());
      lines.push("");
    }
    const one = sumSelectedPrices(ids, input.catalogIndex);
    lines.push(
      `Indicative subtotal per sample: ${formatMoneyPlain(one)} ETB × ${input.sampleCount} sample(s) = ${formatMoneyPlain(one * input.sampleCount)} ETB`,
    );
  } else {
    let grand = 0;
    for (let i = 0; i < input.sampleCount; i++) {
      const ids = [...(input.selectionGroups[i]?.ids ?? [])].sort((a, b) => {
        const codeA = input.catalogIndex.get(a)?.test_code ?? a;
        const codeB = input.catalogIndex.get(b)?.test_code ?? b;
        return codeA.localeCompare(codeB);
      });
      const nm = input.sampleNames[i]?.trim() || `Sample ${i + 1}`;
      lines.push(`--- Sample ${i + 1}: ${nm} ---`);
      lines.push(...linesForSelectedIds(ids, input.catalogIndex));
      const note = input.perSampleNotes[i]?.trim();
      if (note) {
        lines.push("Sample-specific notes:");
        lines.push(note);
        lines.push("");
      }
      grand += sumSelectedPrices(ids, input.catalogIndex);
    }
    if (input.globalNotes.trim()) {
      lines.push("Additional notes (whole job):");
      lines.push(input.globalNotes.trim());
      lines.push("");
    }
    lines.push(`Indicative total (all samples): ${formatMoneyPlain(grand)} ETB`);
  }

  lines.push(`Confirmation code: ${input.confirmationCode}`);
  lines.push(
    "Note: Listed prices are indicative; final billing follows laboratory confirmation.",
  );
  return lines.join("\n");
}

export function buildQrPayload(input: {
  referenceId: string;
  confirmationCode: string;
  selectedIds: string[];
  sampleCount: number;
  multiSampleMode: MultiSampleMode;
  catalogIndex: ClientCatalogIndex;
}): string {
  const items = input.selectedIds
    .map((id) => {
      const test = input.catalogIndex.get(id);
      if (!test) return null;
      return {
        id: test.id,
        code: test.test_code,
        n: test.test_name,
        u: test.unit,
        p: test.priceNumber,
      };
    })
    .filter(Boolean) as {
    id: string;
    code: string;
    n: string;
    u: string;
    p: number;
  }[];

  const total = items.reduce((s, i) => s + i.p, 0);
  const payload = {
    v: 3,
    r: input.referenceId.trim(),
    x: input.confirmationCode,
    nS: input.sampleCount,
    same: input.sampleCount < 2 || input.multiSampleMode === "uniform",
    t: Math.round(total * 100) / 100,
    m: "ETB",
    i: items,
  };
  let out = JSON.stringify(payload);
  if (out.length > 2000) {
    out = JSON.stringify({
      v: 3,
      r: input.referenceId.trim(),
      x: input.confirmationCode,
      nS: input.sampleCount,
      same: input.sampleCount < 2 || input.multiSampleMode === "uniform",
      t: Math.round(total * 100) / 100,
      m: "ETB",
      k: items.length,
    });
  }
  return out;
}

export function defaultSampleNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Sample ${i + 1}`);
}

export function resizeStringArray(prev: string[], count: number, fill: string): string[] {
  return Array.from({ length: count }, (_, i) =>
    i < prev.length ? prev[i]! : fill,
  );
}

export function resizeSets(prev: Set<string>[], count: number): Set<string>[] {
  return Array.from({ length: count }, (_, i) =>
    i < prev.length ? new Set(prev[i]!) : new Set(),
  );
}

export function selectedTestsFromIds(
  ids: Iterable<string>,
  index: ClientCatalogIndex,
): ClientCatalogTest[] {
  return [...ids]
    .map((id) => index.get(id))
    .filter((t): t is ClientCatalogTest => t != null)
    .sort((a, b) => a.test_code.localeCompare(b.test_code));
}
