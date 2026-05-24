import { Loader2, Pencil, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AdminUserRow } from "@/types/account-admin";
import type { DrfPaginated } from "@/types/laboratory";

export function UserManagementTable({
  listData,
  isLoading,
  isError,
  error,
  page,
  totalPages,
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
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (user: AdminUserRow) => void;
  onDeactivate: (user: AdminUserRow) => void;
  onReactivate: (user: AdminUserRow) => void;
  actionDisabled: boolean;
}) {
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
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="min-w-[9rem] px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {listData?.results.map((u: AdminUserRow) => (
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
      </div>

      {listData && listData.count > 0 ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({listData.count} users)
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
