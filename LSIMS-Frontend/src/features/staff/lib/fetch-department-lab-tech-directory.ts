import { fetchAdminUsers } from "@/features/accounts/api";
import { fetchPreparationRecords } from "@/features/laboratory/api";
import {
  buildLabTechDirectory,
  type DepartmentLabTechOption,
} from "@/lib/staff/qc-manager/lab-tech-directory";
import type { PreparationRecord } from "@/types/laboratory";

const PAGE_SIZE = 50;
const MAX_PAGES = 5;

async function paginatePreparationRecords(
  onPage: (results: PreparationRecord[]) => void,
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
  const adminUsers: Awaited<ReturnType<typeof fetchAdminUsers>>["results"] = [];

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
      adminUsers.push(...data.results);
      if (!data.next) break;
      page += 1;
    }
  } catch {
    // qc_manager — expected 403; fall through to laboratory-derived directory
  }

  const prepRecords: PreparationRecord[] = [];
  await paginatePreparationRecords((results) => {
    prepRecords.push(...results);
  });

  return buildLabTechDirectory(adminUsers, prepRecords, userDepartmentId);
}
