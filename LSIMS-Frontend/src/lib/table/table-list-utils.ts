/** Shared sort/search/page-size helpers for data tables. */

export const TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_TABLE_PAGE_SIZE: TablePageSize = 25;

export type SortDirection = "asc" | "desc";

export type SortState<T extends string = string> = {
  key: T;
  direction: SortDirection;
};

export function toggleSortState<T extends string>(
  prev: SortState<T>,
  key: T,
): SortState<T> {
  if (prev.key === key) {
    return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
  }
  return { key, direction: "desc" };
}

export function toOrderingParam(state: SortState): string {
  return state.direction === "desc" ? `-${state.key}` : state.key;
}

export function totalPagesFromCount(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

export function pageRangeLabel(
  page: number,
  pageSize: number,
  count: number,
): string {
  if (count <= 0) return "0 results";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);
  return `${start}–${end} of ${count}`;
}

/** Client-side sort for tables whose API lacks ordering (current page only). */
export function sortRowsClientSide<T>(
  rows: T[],
  sort: SortState,
  getValue: (row: T, key: string) => string | number | null | undefined,
): T[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = getValue(a, sort.key);
    const bv = getValue(b, sort.key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv), undefined, {
      numeric: true,
      sensitivity: "base",
    }) * dir;
  });
}

/** Client-side filter when API search is unavailable (current page only). */
export function filterRowsClientSide<T>(
  rows: T[],
  query: string,
  getSearchText: (row: T) => string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => getSearchText(row).toLowerCase().includes(q));
}

/** Paginate an in-memory row set (client-side page size). */
export function paginateRowsClientSide<T>(
  rows: T[],
  page: number,
  pageSize: number,
): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
