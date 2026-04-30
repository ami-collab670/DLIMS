import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  adminChangeUserPassword,
  createAdminUser,
  deactivateAdminUser,
  fetchAdminUsers,
  patchAdminUser,
  type UpdateAdminUserBody,
} from "@/features/accounts/admin-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AdminUserRow } from "@/types/account-admin";

import { USER_MANAGEMENT_PAGE_SIZE } from "./constants";
import { UserCreateForm } from "./user-create-form";
import { UserEditDialog } from "./user-edit-dialog";
import { UserManagementHeader } from "./user-management-header";
import { UserManagementTable } from "./user-management-table";
import { UserSearchToolbar } from "./user-search-toolbar";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

export default function StaffUserManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data: listData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-users", page, debounced],
    queryFn: () =>
      fetchAdminUsers({ page, search: debounced || undefined }),
  });

  const invalidateUsers = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const createMut = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      toast.success("User created.");
      invalidateUsers();
      setShowCreate(false);
      setCreateFormKey((k) => k + 1);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deactivateMut = useMutation({
    mutationFn: deactivateAdminUser,
    onSuccess: () => {
      toast.success("User deactivated.");
      invalidateUsers();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const reactivateMut = useMutation({
    mutationFn: (userId: string) => patchAdminUser(userId, { is_active: true }),
    onSuccess: () => {
      toast.success("User reactivated.");
      invalidateUsers();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: async (opts: {
      id: string;
      patch: UpdateAdminUserBody;
      newPassword?: string;
    }) => {
      const row = await patchAdminUser(opts.id, opts.patch);
      if (opts.newPassword) {
        await adminChangeUserPassword(opts.id, opts.newPassword);
      }
      return row;
    },
    onSuccess: () => {
      toast.success("User updated.");
      invalidateUsers();
      setEditingUser(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const totalPages = listData
    ? Math.max(1, Math.ceil(listData.count / USER_MANAGEMENT_PAGE_SIZE))
    : 1;

  function handleDeactivate(u: AdminUserRow) {
    if (
      confirm(`Deactivate ${u.email}? They will not be able to sign in.`)
    ) {
      deactivateMut.mutate(u.id);
    }
  }

  function handleReactivate(u: AdminUserRow) {
    if (
      confirm(`Reactivate ${u.email}? They will be able to sign in again.`)
    ) {
      reactivateMut.mutate(u.id);
    }
  }

  return (
    <div className="space-y-8">
      <UserManagementHeader />

      <StaffRoleBanner />

      <UserSearchToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        showCreate={showCreate}
        onToggleCreate={() => setShowCreate((s) => !s)}
      />

      {showCreate ? (
        <UserCreateForm
          key={createFormKey}
          onSubmit={(body) => createMut.mutate(body)}
          isPending={createMut.isPending}
        />
      ) : null}

      {editingUser ? (
        <UserEditDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          isPending={updateMut.isPending}
          onSave={(input) =>
            updateMut.mutateAsync({
              id: editingUser.id,
              patch: input.patch,
              newPassword: input.newPassword,
            })
          }
        />
      ) : null}

      <UserManagementTable
        listData={listData}
        isLoading={isLoading}
        isError={isError}
        error={error}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={setEditingUser}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        actionDisabled={
          deactivateMut.isPending ||
          reactivateMut.isPending ||
          updateMut.isPending
        }
      />
    </div>
  );
}
