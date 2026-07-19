import type { JobOrderStatus } from "@/types/laboratory";

/** React Query keys shared so pipeline tiles and the attention queue reuse the same cache. */
export const dashboardKeys = {
  jobCount: (status: JobOrderStatus) =>
    ["staff-dashboard", "jobs", "count", status] as const,
  sampleCount: (status: string) =>
    ["staff-dashboard", "analyst", "count", status] as const,
  recentJobs: ["staff-dashboard", "jobs", "recent"] as const,
  catalogActive: ["staff-dashboard", "catalog", "active-count"] as const,
  receptionistIntakeQueue: ["staff-dashboard", "receptionist", "intake-queue"] as const,
  receptionistTodaysSamples: ["staff-dashboard", "receptionist", "todays-samples"] as const,
  receptionistAwaitingPayment: ["staff-dashboard", "receptionist", "awaiting-payment"] as const,
  receptionistRecentMessages: ["staff-dashboard", "receptionist", "recent-messages"] as const,
  receptionistKpis: ["staff-dashboard", "receptionist", "kpis"] as const,
} as const;
