import type { JobOrderListParams } from "./api";

export const jobKeys = {
  all: ["jobs"] as const,
  list: (params?: JobOrderListParams) => ["jobs", "list", params] as const,
  detail: (id: string) => ["jobs", "detail", id] as const,
  resultSummary: (jobId: string) => ["jobs", "result-summary", jobId] as const,
};

/** Preserved for cache compatibility with existing client job request form. */
export const CLIENT_SERVICE_CATALOG_QUERY_KEY = [
  "client-service-catalog",
] as const;
