import { apiClient } from "@/api/client";
import type { AuthUser, RegisterResponse, TokenPair } from "@/types/auth";

export async function loginRequest(
  email: string,
  password: string,
): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>("/api/auth/token/", {
    email,
    password,
  });
  return data;
}

export type RegisterPayload = {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  nationality?: string;
  organization_name?: string;
  organization_type?: string;
};

export async function registerRequest(
  body: RegisterPayload,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(
    "/api/auth/register/",
    body,
  );
  return data;
}

export async function fetchProfile(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/api/accounts/profile/");
  return data;
}
