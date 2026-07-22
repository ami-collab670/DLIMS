import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  adminChangeUserPassword,
  createAdminUser,
  createDepartment,
  createRole,
  deactivateAdminUser,
  deleteDepartment,
  deleteRole,
  fetchAdminUser,
  fetchAdminUsers,
  fetchAnalystUsers,
  fetchDepartment,
  fetchDepartments,
  fetchExternalClients,
  fetchLabAnalysts,
  fetchLabClients,
  fetchRole,
  fetchRoles,
  patchAdminUser,
  patchDepartment,
  patchRole,
  quickRegisterWalkInClient,
  replaceRole,
  type CreateAdminUserBody,
  type CreateRoleBody,
  type QuickRegisterWalkInInput,
  type UpdateAdminUserBody,
} from "@/features/accounts/api";
import { accountKeys } from "@/features/accounts/query-keys";
import { getApiErrorMessage } from "@/lib/api";
import type { AdminUserRow, DepartmentRecord, RoleRecord } from "@/types/account-admin";
import type { DrfPaginated } from "@/types/laboratory";

const DEFAULT_LIST_STALE_MS = 30_000;

function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: accountKeys.all });
  };
}

type AdminUsersListParams = Parameters<typeof fetchAdminUsers>[0];
type DepartmentsListParams = Parameters<typeof fetchDepartments>[0];
type RolesListParams = Parameters<typeof fetchRoles>[0];
type ExternalClientsParams = Parameters<typeof fetchExternalClients>[0];
type AnalystUsersParams = Parameters<typeof fetchAnalystUsers>[0];

export function useAdminUsers(
  params: AdminUsersListParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<AdminUserRow>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: accountKeys.adminUsers.list(params),
    queryFn: () => fetchAdminUsers(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useAdminUser(
  id: string,
  options?: Omit<UseQueryOptions<AdminUserRow>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: accountKeys.adminUsers.detail(id),
    queryFn: () => fetchAdminUser(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useExternalClients(
  params?: ExternalClientsParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<AdminUserRow>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: accountKeys.adminUsers.externalClients(params),
    queryFn: () => fetchExternalClients(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useAnalystUsers(
  params?: AnalystUsersParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<AdminUserRow>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: accountKeys.adminUsers.analystUsers(params),
    queryFn: () => fetchAnalystUsers(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useDepartments(
  params?: DepartmentsListParams,
  options?: Omit<
    UseQueryOptions<DrfPaginated<DepartmentRecord>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: accountKeys.departments.list(params),
    queryFn: () => fetchDepartments(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useDepartment(
  id: string,
  options?: Omit<UseQueryOptions<DepartmentRecord>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: accountKeys.departments.detail(id),
    queryFn: () => fetchDepartment(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useRoles(
  params?: RolesListParams,
  options?: Omit<UseQueryOptions<RoleRecord[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: accountKeys.roles.list(params),
    queryFn: () => fetchRoles(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useRole(
  id: string,
  options?: Omit<UseQueryOptions<RoleRecord>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: accountKeys.roles.detail(id),
    queryFn: () => fetchRole(id),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useLabAnalysts(
  options?: Omit<UseQueryOptions<AdminUserRow[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: accountKeys.labAnalysts(),
    queryFn: fetchLabAnalysts,
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useLabClients(
  options?: Omit<UseQueryOptions<AdminUserRow[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: accountKeys.labClients(),
    queryFn: fetchLabClients,
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

export function useCreateAdminUser() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (body: CreateAdminUserBody) => createAdminUser(body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeactivateAdminUser() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (userId: string) => deactivateAdminUser(userId),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchAdminUser() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: string;
      body: UpdateAdminUserBody;
    }) => patchAdminUser(userId, body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useAdminChangeUserPassword() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => adminChangeUserPassword(userId, newPassword),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCreateDepartment() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      createDepartment(body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchDepartment() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{ name: string; description: string }>;
    }) => patchDepartment(id, body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCreateRole() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (body: CreateRoleBody) => createRole(body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePatchRole() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<CreateRoleBody>;
    }) => patchRole(id, body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useReplaceRole() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateRoleBody }) =>
      replaceRole(id, body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useQuickRegisterWalkInClient(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (input: QuickRegisterWalkInInput) =>
      quickRegisterWalkInClient(input),
    onSuccess: () => {
      options?.onSuccess?.();
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
