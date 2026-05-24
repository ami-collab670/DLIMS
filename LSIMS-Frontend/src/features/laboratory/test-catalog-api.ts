import { fetchTestCatalog } from "@/features/laboratory/staff-api";
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
