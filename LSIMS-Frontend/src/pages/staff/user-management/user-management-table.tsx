import { Loader2, Pencil, ShieldAlert } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { sortRowsClientSide, type SortState, type TablePageSize } from "@/lib/table-list-utils";
import type { AdminUserRow } from "@/types/account-admin";
import type { DrfPaginated } from "@/types/laboratory";

type UserSortKey = "email" | "name" | "user_type" | "role" | "is_active";

const DEFAULT_USER_SORT: SortState<UserSortKey> = {
  key: "email",
  direction: "asc",
};

export function UserManagementTable({
  listData,
  isLoading,
  isError,
  error,
  page,
  pageSize,
  totalPages: _totalPages,
  onPageChange,
  onEdit,
  onDeactivate,
  onReactivate,
  actionDisabled,
}: {
  listData: DrfPaginated<AdminUserRow> | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  page: number;
  pageSize: TablePageSize;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (user: AdminUserRow) => void;
  onDeactivate: (user: AdminUserRow) => void;
  onReactivate: (user: AdminUserRow) => void;
  actionDisabled: boolean;
}) {
  const [sort, setSort] = useState(DEFAULT_USER_SORT);

  const handleSort = useCallback((key: UserSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }, []);

  // Users API has no ordering param — sort current page only.
  const rows = useMemo(() => {
    const base = listData?.results ?? [];
    return sortRowsClientSide(base, sort, (row, key) => {
      const u = row as AdminUserRow;
      switch (key as UserSortKey) {
        case "email":
          return u.email;
        case "name":
          return [u.first_name, u.last_name].filter(Boolean).join(" ");
        case "user_type":
          return u.user_type;
        case "role":
          return u.role_detail?.display_name ?? "";
        case "is_active":
          return u.is_active ? 1 : 0;
        default:
          return "";
      }
    });
  }, [listData?.results, sort]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 p-6 text-destructive">
            <ShieldAlert className="size-5 shrink-0" />
            {getApiErrorMessage(error)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <SortableTableHead
                    label="Email"
                    sortKey="email"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Name"
                    sortKey="name"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Type"
                    sortKey="user_type"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Role"
                    sortKey="role"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Active"
                    sortKey="is_active"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <th className="min-w-[9rem] px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((u: AdminUserRow) => (
                  <tr key={u.id} className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span>{u.email}</span>
                        {u.is_superuser ? (
                          <span className="inline-flex w-fit rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-800 dark:text-violet-200">
                            Superuser
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 capitalize">{u.user_type}</td>
                    <td className="px-4 py-3">
                      {u.role_detail?.display_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        "Yes"
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={actionDisabled}
                          onClick={() => onEdit(u)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </Button>
                        {u.is_active ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            disabled={actionDisabled}
                            onClick={() => onDeactivate(u)}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={actionDisabled}
                            onClick={() => onReactivate(u)}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {listData && listData.count > 0 ? (
          <TablePaginationFooter
            page={page}
            pageSize={pageSize}
            count={listData.count}
            onPageChange={onPageChange}
          />
        ) : null}
      </div>
    </>
  );
}
