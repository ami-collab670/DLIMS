import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { adminChangeUserPassword } from "@/features/accounts/api";
import {
  changeOwnPassword,
  fetchProfile,
  updateProfile,
  type ProfileUpdatePayload,
} from "@/features/profile/api";
import { profileKeys } from "@/features/profile/query-keys";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthUser } from "@/types/auth";

const DEFAULT_PROFILE_STALE_MS = 30_000;

export function useProfile(
  options?: Omit<UseQueryOptions<AuthUser>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: fetchProfile,
    staleTime: DEFAULT_PROFILE_STALE_MS,
    ...options,
  });
}

export function useUpdateProfile(options?: {
  onSuccess?: (user: AuthUser) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) => updateProfile(payload),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
      options?.onSuccess?.(user);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useChangePassword(options?: {
  onSuccess?: (response: { detail: string }) => void;
}) {
  return useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) =>
      changeOwnPassword(body),
    onSuccess: (response) => {
      toast.success(
        "Password updated. Your current session may remain active until you sign out or the token expires.",
      );
      options?.onSuccess?.(response);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useChangeOwnPasswordAsAdmin(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        throw new Error("Not signed in.");
      }
      await adminChangeUserPassword(userId, newPassword);
    },
    onSuccess: () => options?.onSuccess?.(),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
