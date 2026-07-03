import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_TABLE_PAGE_SIZE,
  filterRowsClientSide,
  paginateRowsClientSide,
  sortRowsClientSide,
  totalPagesFromCount,
  toggleSortState,
  type SortState,
  type TablePageSize,
} from "@/lib/table-list-utils";

import { useDebouncedValue } from "./use-debounced-value";

/**
 * Client-side search/sort/pagination for tables that load a single API page
 * or a bounded result set (see inline note at call sites).
 */
export function useClientSideTableList<T, K extends string = string>(options: {
  rows: T[];
  defaultSort: SortState<K>;
  getSearchText: (row: T) => string;
  getSortValue: (row: T, key: K) => string | number | null | undefined;
  initialPageSize?: TablePageSize;
}) {
  const {
    rows,
    defaultSort,
    getSearchText,
    getSortValue,
    initialPageSize = DEFAULT_TABLE_PAGE_SIZE,
  } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(initialPageSize);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [sort, setSort] = useState<SortState<K>>(defaultSort);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort, pageSize, rows.length]);

  const handleSort = useCallback((key: K) => {
    setSort((prev) => toggleSortState(prev, key));
  }, []);

  const filtered = useMemo(
    () => filterRowsClientSide(rows, debouncedSearch, getSearchText),
    [rows, debouncedSearch, getSearchText],
  );

  const sorted = useMemo(
    () =>
      sortRowsClientSide(filtered, sort, (row, key) =>
        getSortValue(row, key as K),
      ),
    [filtered, sort, getSortValue],
  );

  const totalPages = totalPagesFromCount(sorted.length, pageSize);
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const pageRows = useMemo(
    () => paginateRowsClientSide(sorted, safePage, pageSize),
    [sorted, safePage, pageSize],
  );

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    searchInput,
    setSearchInput,
    sort,
    handleSort,
    pageRows,
    totalCount: sorted.length,
    totalPages,
  };
}
