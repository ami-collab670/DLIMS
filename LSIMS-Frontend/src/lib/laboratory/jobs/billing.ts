import { parseClientReferenceId } from "@/lib/laboratory";
import { formatMoneyPlain } from "@/lib/formatting";
import type { SampleRecord, TestCatalogItem } from "@/types/laboratory";

export type JobBillingLine = {
  testCode: string;
  department: string;
  testName: string;
  priceEtb: number;
  unit?: string;
};

export type JobBillingSummary = {
  clientRef?: string;
  priority?: string;
  sampleCount?: number;
  confirmationCode?: string;
  lines: JobBillingLine[];
  indicativeTotal: number | null;
  parseWarnings: string[];
};

const CATALOG_LINE =
  /^-\s*\[([^\]·]+)\s·\s([^\]]+)\]\s+(.+?)\s+—\s+([\d.]+)\s+ETB(?:\s+\(([^)]+)\))?$/i;

const INDICATIVE_TOTAL =
  /^Indicative (?:subtotal per sample: .+ = |total \(all samples\): )([\d.]+)\s+ETB/i;

const INDICATIVE_SUBTOTAL_SIMPLE =
  /^Indicative subtotal per sample:\s+([\d.]+)\s+ETB\s×\s+(\d+)\s+sample/i;

export function parseJobBillingSummary(
  description: string | null | undefined,
): JobBillingSummary {
  const parseWarnings: string[] = [];
  const lines: JobBillingLine[] = [];
  let indicativeTotal: number | null = null;

  if (!description?.trim()) {
    return {
      lines,
      indicativeTotal: null,
      parseWarnings: ["No job description available."],
    };
  }

  const textLines = description.split("\n");
  let priority: string | undefined;
  let sampleCount: number | undefined;
  let confirmationCode: string | undefined;

  for (const line of textLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const catalogMatch = trimmed.match(CATALOG_LINE);
    if (catalogMatch) {
      lines.push({
        testCode: catalogMatch[1]!.trim(),
        department: catalogMatch[2]!.trim(),
        testName: catalogMatch[3]!.trim(),
        priceEtb: parseFloat(catalogMatch[4]!) || 0,
        unit: catalogMatch[5]?.trim() || undefined,
      });
      continue;
    }

    const totalMatch = trimmed.match(INDICATIVE_TOTAL);
    if (totalMatch) {
      indicativeTotal = parseFloat(totalMatch[1]!) || null;
      continue;
    }

    const subtotalMatch = trimmed.match(INDICATIVE_SUBTOTAL_SIMPLE);
    if (subtotalMatch && indicativeTotal == null) {
      indicativeTotal = parseFloat(subtotalMatch[1]!) || null;
    }

    if (/^Requested priority:/i.test(trimmed)) {
      priority = trimmed.replace(/^Requested priority:\s*/i, "").trim();
    }
    if (/^Number of samples:/i.test(trimmed)) {
      const n = parseInt(trimmed.replace(/^Number of samples:\s*/i, ""), 10);
      if (Number.isFinite(n)) sampleCount = n;
    }
    if (/^Confirmation code:/i.test(trimmed)) {
      confirmationCode = trimmed.replace(/^Confirmation code:\s*/i, "").trim();
    }
  }

  if (lines.length === 0) {
    parseWarnings.push("No catalog test lines found in job description.");
  }
  if (indicativeTotal == null && lines.length > 0) {
    indicativeTotal = lines.reduce((sum, l) => sum + l.priceEtb, 0);
    parseWarnings.push("Indicative total estimated from line items.");
  }

  return {
    clientRef: parseClientReferenceId(description),
    priority,
    sampleCount,
    confirmationCode,
    lines,
    indicativeTotal,
    parseWarnings,
  };
}

export function buildCatalogPriceByCode(
  catalog: TestCatalogItem[],
): Map<string, TestCatalogItem> {
  const map = new Map<string, TestCatalogItem>();
  for (const t of catalog) {
    map.set(t.test_code.toLowerCase(), t);
  }
  return map;
}

export function enrichBillingFromSamples(
  summary: JobBillingSummary,
  samples: SampleRecord[],
  catalogByCode: Map<string, TestCatalogItem>,
): JobBillingSummary {
  if (summary.lines.length > 0) return summary;

  const seen = new Set<string>();
  const lines: JobBillingLine[] = [];

  for (const sample of samples) {
    for (const st of sample.sample_tests ?? []) {
      const key = st.test_code.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const catalog = catalogByCode.get(key);
      lines.push({
        testCode: st.test_code,
        department: catalog?.department ?? "—",
        testName: st.test_name || catalog?.test_name || st.test_code,
        priceEtb: catalog ? parseFloat(catalog.price) || 0 : 0,
        unit: catalog?.unit || undefined,
      });
    }
  }

  if (lines.length === 0) return summary;

  const indicativeTotal = lines.reduce((sum, l) => sum + l.priceEtb, 0);
  return {
    ...summary,
    lines,
    indicativeTotal,
    parseWarnings: [
      ...summary.parseWarnings.filter((w) => !w.includes("No catalog")),
      "Pricing loaded from registered sample tests.",
    ],
  };
}

export function suggestedInvoiceAmount(summary: JobBillingSummary): string {
  if (summary.indicativeTotal == null || summary.indicativeTotal <= 0) return "";
  return formatMoneyPlain(summary.indicativeTotal);
}
