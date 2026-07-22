import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDepartments } from "@/features/accounts/hooks";
import {
  useCreateTestCatalogItem,
  useTestCatalog,
} from "@/features/laboratory/hooks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import {
  sortRowsClientSide,
  type SortState,
  type TablePageSize,
} from "@/lib/table";
import type { TestCatalogItem } from "@/types/laboratory";

import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/table";
import { CatalogRow } from "./catalog-row";

type CatalogSortKey = "test_code" | "test_name" | "unit" | "price" | "department" | "is_active";

const DEFAULT_CATALOG_SORT: SortState<CatalogSortKey> = {
  key: "test_code",
  direction: "asc",
};

export function StaffCatalogSection({
  canWrite,
  hidePricing = false,
  hideDepartmentColumn = false,
  fixedDepartmentId,
}: {
  canWrite: boolean;
  hidePricing?: boolean;
  hideDepartmentColumn?: boolean;
  /** Lock create form department (e.g. department manager). */
  fixedDepartmentId?: string | null;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(DEFAULT_TABLE_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [sort, setSort] = useState(DEFAULT_CATALOG_SORT);

  const catalogParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debounced || undefined,
    }),
    [page, pageSize, debounced],
  );

  const { data, isLoading, isError, error } = useTestCatalog(catalogParams);

  const { data: departmentsData } = useDepartments(
    { page: 1 },
    { enabled: canWrite && !fixedDepartmentId },
  );
  const departments = departmentsData?.results ?? [];

  const [form, setForm] = useState({
    test_name: "",
    test_code: "",
    unit: "",
    price: "0",
    description: "",
    department: fixedDepartmentId ?? "",
  });

  useEffect(() => {
    if (fixedDepartmentId) {
      setForm((f) => ({ ...f, department: fixedDepartmentId }));
    }
  }, [fixedDepartmentId]);

  const createMut = useCreateTestCatalogItem({
    onSuccess: () => {
      toast.success("Test added.");
      setForm({
        test_name: "",
        test_code: "",
        unit: "",
        price: "0",
        description: "",
        department: fixedDepartmentId ?? "",
      });
    },
  });

  const handleSort = useCallback((key: CatalogSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }, []);

  const rows = useMemo(() => {
    const base = data?.results ?? [];
    return sortRowsClientSide(base, sort, (row, key) => {
      const item = row as TestCatalogItem;
      switch (key as CatalogSortKey) {
        case "test_code":
          return item.test_code;
        case "test_name":
          return item.test_name;
        case "unit":
          return item.unit;
        case "price":
          return Number(item.price);
        case "department":
          return item.department ?? "";
        case "is_active":
          return item.is_active ? 1 : 0;
        default:
          return "";
      }
    });
  }, [data?.results, sort]);

  return (
    <div className="space-y-4">
      {!canWrite ? (
        <p className="text-sm text-muted-foreground">
          Test catalog edits require admin, superuser, or department manager (qc_manager) role.
        </p>
      ) : (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.test_name || !form.test_code || !form.unit) {
              toast.error("Name, code, and unit are required.");
              return;
            }
            createMut.mutate({
              test_name: form.test_name.trim(),
              test_code: form.test_code.trim().toUpperCase(),
              unit: form.unit.trim(),
              price: form.price,
              description: form.description.trim() || undefined,
              department: form.department.trim() || null,
              is_active: true,
            });
          }}
        >
          <p className="md:col-span-2 text-sm font-medium">Add catalog entry</p>
          <Input
            placeholder="Test name"
            value={form.test_name}
            onChange={(e) => setForm((f) => ({ ...f, test_name: e.target.value }))}
          />
          <Input
            placeholder="Code e.g. GFA-01"
            value={form.test_code}
            onChange={(e) => setForm((f) => ({ ...f, test_code: e.target.value }))}
          />
          <Input
            placeholder="Unit e.g. ppm"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          />
          {!hidePricing ? (
            <Input
              type="number"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          ) : null}
          {!fixedDepartmentId ? (
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm md:col-span-2"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            >
              <option value="">Department (optional for admin)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : null}
          {!fixedDepartmentId && departments.length === 0 ? (
            <p className="md:col-span-2 text-xs text-muted-foreground">
              No departments loaded — qc_manager accounts use their profile department automatically.
            </p>
          ) : null}
          <Textarea
            className="md:col-span-2"
            placeholder="Description"
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <Button type="submit" disabled={createMut.isPending}>
            Add test
          </Button>
        </form>
      )}

      <TableToolbar
        searchPlaceholder="Search tests…"
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-destructive">{getApiErrorMessage(error)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <SortableTableHead
                    label="Code"
                    sortKey="test_code"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Name"
                    sortKey="test_name"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Unit"
                    sortKey="unit"
                    sort={sort}
                    onSort={handleSort}
                  />
                  {!hidePricing ? (
                    <SortableTableHead
                      label="Price"
                      sortKey="price"
                      sort={sort}
                      onSort={handleSort}
                    />
                  ) : null}
                  {!hideDepartmentColumn ? (
                    <SortableTableHead
                      label="Department"
                      sortKey="department"
                      sort={sort}
                      onSort={handleSort}
                    />
                  ) : null}
                  <SortableTableHead
                    label="Active"
                    sortKey="is_active"
                    sort={sort}
                    onSort={handleSort}
                  />
                  {canWrite ? <th className="px-4 py-2 font-medium" /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((t: TestCatalogItem) => (
                  <CatalogRow
                    key={t.id}
                    test={t}
                    canWrite={canWrite}
                    hidePricing={hidePricing}
                    hideDepartmentColumn={hideDepartmentColumn}
                    onPatched={() => {}}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 0 ? (
          <TablePaginationFooter
            page={page}
            pageSize={pageSize}
            count={data.count}
            onPageChange={setPage}
          />
        ) : null}
      </div>
    </div>
  );
}
