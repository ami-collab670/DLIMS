import axios from "axios";

import { env } from "@/config/env";
import { authStorage } from "@/lib/auth-storage";

export async function refreshAccessToken(): Promise<string> {
  const refresh = authStorage.getRefresh();
  if (!refresh) {
    throw new Error("No refresh token");
  }
  const base = env.apiBaseUrl.replace(/\/$/, "");
  const { data } = await axios.post<{ access: string }>(
    `${base}/api/auth/token/refresh/`,
    { refresh },
    { headers: { "Content-Type": "application/json" } },
  );
  authStorage.setAccess(data.access);
  return data.access;
}
