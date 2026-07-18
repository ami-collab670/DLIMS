import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { useTrackedTabs } from "@/hooks/use-tracked-tabs";
import {
  adminChangeUserPassword,
  createAdminUser,
  deactivateAdminUser,
  fetchAdminUsers,
  patchAdminUser,
  type UpdateAdminUserBody,
} from "@/features/accounts/admin-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TablePageSize } from "@/lib/table-list-utils";
import type { AdminUserRow } from "@/types/account-admin";

import { USER_MANAGEMENT_PAGE_SIZE } from "./constants";
import { DepartmentsManagementSection } from "./departments-management-section";
import { RolesManagementSection } from "./roles-management-section";
import { UserCreateForm } from "./user-create-form";
import { UserEditDialog } from "./user-edit-dialog";
import { UserManagementHeader } from "./user-management-header";
import { UserManagementTable } from "./user-management-table";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

const USER_MANAGEMENT_TAB_LABELS = {
  users: "Users",
  roles: "Roles",
  departments: "Departments",
} as const;

export default function StaffUserManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(USER_MANAGEMENT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useTrackedTabs<
    "users" | "roles" | "departments"
  >("users");
  const [createFormKey, setCreateFormKey] = useState(0);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);

  useEffect(() => setPage(1), [debounced, pageSize]);

  const tabSegments = useMemo(
    () => [{ label: USER_MANAGEMENT_TAB_LABELS[activeTab] }],
    [activeTab],
  );
  useBreadcrumbSegments(tabSegments, "user-management-tab");

  const {
    data: listData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-users", page, pageSize, debounced],
    queryFn: () =>
      fetchAdminUsers({
        page,
        page_size: pageSize,
        search: debounced || undefined,
      }),
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
    ? Math.max(1, Math.ceil(listData.count / pageSize))
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

      <div className="flex gap-2 border-b">
        <Button
          type="button"
          variant={activeTab === "users" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("users")}
        >
          Users
        </Button>
        <Button
          type="button"
          variant={activeTab === "roles" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("roles")}
        >
          Roles
        </Button>
        <Button
          type="button"
          variant={activeTab === "departments" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("departments")}
        >
          Departments
        </Button>
      </div>

      {activeTab === "roles" ? <RolesManagementSection /> : null}
      {activeTab === "departments" ? <DepartmentsManagementSection /> : null}

      {activeTab === "users" ? (
        <>
      <TableToolbar
        searchId="user-search"
        searchPlaceholder="Email, name, username…"
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
      >
        <Button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="shrink-0 gap-2 sm:ml-auto"
        >
          {showCreate ? "Close form" : "New user"}
        </Button>
      </TableToolbar>

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
        pageSize={pageSize}
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
        </>
      ) : null}
    </div>
  );
}
