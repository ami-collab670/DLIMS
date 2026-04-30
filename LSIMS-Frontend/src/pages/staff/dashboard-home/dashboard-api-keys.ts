import type { JobOrderStatus } from "@/types/laboratory";

/** React Query keys shared so pipeline tiles and the attention queue reuse the same cache. */
export const dashboardKeys = {
  jobCount: (status: JobOrderStatus) =>
    ["staff-dashboard", "jobs", "count", status] as const,
  sampleCount: (status: string) =>
    ["staff-dashboard", "samples", "count", status] as const,
  recentJobs: ["staff-dashboard", "jobs", "recent"] as const,
  catalogActive: ["staff-dashboard", "catalog", "active-count"] as const,
} as const;
