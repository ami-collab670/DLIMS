import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { refreshAccessToken } from "@/api/token-refresh";
import { env } from "@/config/env";
import { authStorage } from "@/lib/auth-storage";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl ? env.apiBaseUrl.replace(/\/$/, "") : undefined,
  paramsSerializer: {
    indexes: null,
  },
});

let refreshPromise: Promise<string> | null = null;

function isAuthPath(url: string | undefined) {
  if (!url) return false;
  return (
    url.includes("/api/auth/token/") ||
    url.includes("/api/auth/register/")
  );
}

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !original ||
      original._retry ||
      isAuthPath(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const access = await refreshPromise;
      original.headers.Authorization = `Bearer ${access}`;
      return apiClient(original);
    } catch {
      const { useAuthStore } = await import("@/stores/auth-store");
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }
  },
);
