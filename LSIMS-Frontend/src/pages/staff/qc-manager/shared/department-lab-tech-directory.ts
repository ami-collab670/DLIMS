import { fetchAdminUsers } from "@/features/accounts/admin-api";
import { fetchPreparationRecords } from "@/features/laboratory/preparation-records-api";

import { isUserUuid } from "./department-analyst-directory";

export type DepartmentLabTechOption = {
  id: string;
  email: string;
};

const PAGE_SIZE = 50;
const MAX_PAGES = 5;

function mergeLabTech(
  map: Map<string, DepartmentLabTechOption>,
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

async function paginatePreparationRecords(
  onPage: (
    results: Awaited<ReturnType<typeof fetchPreparationRecords>>["results"],
  ) => void,
) {
  let page = 1;
  let total = Infinity;
  while (page <= MAX_PAGES && (page - 1) * PAGE_SIZE < total) {
    const data = await fetchPreparationRecords({ page, page_size: PAGE_SIZE });
    total = data.count;
    onPage(data.results);
    if (!data.next) break;
    page += 1;
  }
}

/** Build lab technician picker options from department-scoped preparation records. */
export async function fetchDepartmentLabTechDirectory(
  userDepartmentId: string | null | undefined,
): Promise<DepartmentLabTechOption[]> {
  const map = new Map<string, DepartmentLabTechOption>();

  try {
    let page = 1;
    let total = Infinity;
    while (page <= MAX_PAGES && (page - 1) * PAGE_SIZE < total) {
      const data = await fetchAdminUsers({
        page,
        page_size: PAGE_SIZE,
        user_type: "internal",
        role_name: "lab_technician",
        is_active: true,
      });
      total = data.count;
      for (const row of data.results) {
        if (userDepartmentId && row.department !== userDepartmentId) continue;
        mergeLabTech(map, row.id, row.email);
      }
      if (!data.next) break;
      page += 1;
    }
  } catch {
    // qc_manager — expected 403; fall through to laboratory-derived directory
  }

  await paginatePreparationRecords((results) => {
    for (const row of results) {
      mergeLabTech(map, row.technician, row.technician_email);
    }
  });

  return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
}
