import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  confirmPasswordReset,
  loginRequest,
  registerRequest,
  requestPasswordReset,
  type RegisterPayload,
} from "@/features/auth/api";
import { getApiErrorMessage } from "@/lib/api";
import type { RegisterResponse, TokenPair } from "@/types/auth";

export function useLogin(options?: { onSuccess?: (tokens: TokenPair) => void }) {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginRequest(email, password),
    onSuccess: (tokens) => options?.onSuccess?.(tokens),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRegister(options?: {
  onSuccess?: (response: RegisterResponse) => void;
}) {
  return useMutation({
    mutationFn: (body: RegisterPayload) => registerRequest(body),
    onSuccess: (response) => options?.onSuccess?.(response),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRequestPasswordReset(options?: {
  onSuccess?: (response: { detail: string }) => void;
}) {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    onSuccess: (response) => options?.onSuccess?.(response),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useConfirmPasswordReset(options?: {
  onSuccess?: (response: { detail: string }) => void;
}) {
  return useMutation({
    mutationFn: (body: {
      email: string;
      otp: string;
      new_password: string;
    }) => confirmPasswordReset(body),
    onSuccess: (response) => options?.onSuccess?.(response),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
