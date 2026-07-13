import { fetchDepartments } from "@/features/accounts/departments-api";
import { fetchTestCatalog } from "@/features/laboratory/staff-api";
import type { DepartmentRecord } from "@/types/account-admin";
import type { TestCatalogItem } from "@/types/laboratory";

/** Loads every active catalog entry (paginates until exhausted). */
export async function fetchActiveTestCatalog(): Promise<TestCatalogItem[]> {
  const items: TestCatalogItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchTestCatalog({ page, is_active: true });
    items.push(...data.results);
    hasMore = data.next != null;
    page += 1;
  }

  return items;
}

async function fetchAllDepartments(): Promise<DepartmentRecord[]> {
  const items: DepartmentRecord[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchDepartments({ page });
    items.push(...data.results);
    hasMore = data.next != null;
    page += 1;
  }

  return items;
}

/** Active tests and departments for the client service catalog picker. */
export async function fetchClientServiceCatalog(): Promise<{
  tests: TestCatalogItem[];
  departments: DepartmentRecord[];
}> {
  const [tests, departments] = await Promise.all([
    fetchActiveTestCatalog(),
    fetchAllDepartments(),
  ]);
  return { tests, departments };
}
