/**
 * Without a base URL, axios posts to the dev server origin (e.g. :5173) → 404 on /api/*.
 *
 * - **Dev:** default is `""` so requests are same-origin; `vite.config.ts` proxies `/api` → Django.
 * - **Prod:** set `VITE_API_BASE_URL` to your API (e.g. `https://api.example.com`).
 */
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "" : "");

export const env = {
  apiBaseUrl,
  appName: import.meta.env.VITE_APP_NAME ?? "LSIMS",
} as const;
