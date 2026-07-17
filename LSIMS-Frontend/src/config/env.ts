/**
 * Without a base URL, CMS requests use same-origin `/cms-api` in dev (Vite proxy).
 *
 * - **Dev:** default is `/cms-api` (proxied to Strapi).
 * - **Prod:** set `VITE_CMS_API_BASE_URL` (e.g. `https://cms.example.com/api`).
 */
const cmsApiBaseUrl =
  import.meta.env.VITE_CMS_API_BASE_URL ||
  (import.meta.env.DEV ? "/cms-api" : "");

export const env = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "" : ""),
  cmsApiBaseUrl: cmsApiBaseUrl.replace(/\/$/, ""),
  appName: import.meta.env.VITE_APP_NAME ?? "LSIMS",
} as const;
