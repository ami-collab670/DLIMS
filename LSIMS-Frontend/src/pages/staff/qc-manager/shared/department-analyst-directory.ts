import { fetchLabAnalysts } from "@/features/accounts/lab-analysts-api";
import { fetchAnalysisResults } from "@/features/laboratory/analysis-results-api";
import { fetchSamples } from "@/features/laboratory/staff-api";

export type DepartmentAnalystOption = {
  id: string;
  email: string;
};

const PAGE_SIZE = 50;
const MAX_PAGES = 5;

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

async function paginateSamples(
  onPage: (results: Awaited<ReturnType<typeof fetchSamples>>["results"]) => void,
) {
  let page = 1;
  let total = Infinity;
  while (page <= MAX_PAGES && (page - 1) * PAGE_SIZE < total) {
    const data = await fetchSamples({ page, page_size: PAGE_SIZE });
    total = data.count;
    onPage(data.results);
    if (!data.next) break;
    page += 1;
  }
}

async function paginateAnalysisResults(
  onPage: (results: Awaited<ReturnType<typeof fetchAnalysisResults>>["results"]) => void,
) {
  let page = 1;
  let total = Infinity;
  while (page <= MAX_PAGES && (page - 1) * PAGE_SIZE < total) {
    const data = await fetchAnalysisResults({ page });
    total = data.count;
    onPage(data.results);
    if (!data.next) break;
    page += 1;
  }
}

/** Build analyst picker options (UUID + email) for department managers without /api/accounts/analysts/. */
export async function fetchDepartmentAnalystDirectory(
  userDepartmentId: string | null | undefined,
): Promise<DepartmentAnalystOption[]> {
  const map = new Map<string, DepartmentAnalystOption>();

  try {
    const labAnalysts = await fetchLabAnalysts();
    for (const analyst of labAnalysts) {
      if (userDepartmentId && analyst.department !== userDepartmentId) continue;
      mergeAnalyst(map, analyst.id, analyst.email);
    }
  } catch {
    // qc_manager — expected 403; fall through to laboratory-derived directory
  }

  await paginateAnalysisResults((results) => {
    for (const row of results) {
      mergeAnalyst(map, row.analyst, row.analyst_email);
    }
  });

  await paginateSamples((results) => {
    for (const row of results) {
      mergeAnalyst(map, row.assigned_analyst, row.assigned_analyst_email);
    }
  });

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
