import { fetchLabAnalysts } from "@/features/accounts/api";
import { fetchAnalysisResults, fetchSamples } from "@/features/laboratory/api";
import {
  buildAnalystDirectory,
  type DepartmentAnalystOption,
} from "@/lib/staff/qc-manager/analyst-directory";
import type { AnalysisResult, SampleRecord } from "@/types/laboratory";

const PAGE_SIZE = 50;
const MAX_PAGES = 5;

async function paginateSamples(
  onPage: (results: SampleRecord[]) => void,
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
  onPage: (results: AnalysisResult[]) => void,
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
  let labAnalysts: Awaited<ReturnType<typeof fetchLabAnalysts>> = [];

  try {
    labAnalysts = await fetchLabAnalysts();
  } catch {
    // qc_manager — expected 403; fall through to laboratory-derived directory
  }

  const analysisResults: AnalysisResult[] = [];
  await paginateAnalysisResults((results) => {
    analysisResults.push(...results);
  });

  const samples: SampleRecord[] = [];
  await paginateSamples((results) => {
    samples.push(...results);
  });

  return buildAnalystDirectory(labAnalysts, analysisResults, samples, userDepartmentId);
}
