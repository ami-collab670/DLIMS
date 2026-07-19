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
  financeKpis: ["staff-dashboard", "finance", "kpis"] as const,
  financeAwaitingClearance: ["staff-dashboard", "finance", "awaiting-clearance"] as const,
  financeOutstanding: ["staff-dashboard", "finance", "outstanding"] as const,
  financeRecentlyCleared: ["staff-dashboard", "finance", "recently-cleared"] as const,
  financeHoldQueue: ["staff-dashboard", "finance", "hold-queue"] as const,
  financeDiscountTracker: ["staff-dashboard", "finance", "discount-tracker"] as const,
  financeAllRecords: ["staff-dashboard", "finance", "all-records"] as const,
  financeReportsSnapshot: ["staff-dashboard", "finance", "reports-snapshot"] as const,
  financeCompliancePreview: ["staff-dashboard", "finance", "compliance-preview"] as const,
  financeFollowUp: ["staff-dashboard", "finance", "follow-up"] as const,
  financeWaiverRelease: ["staff-dashboard", "finance", "waiver-release"] as const,
  financeRecentNotifications: ["staff-dashboard", "finance", "recent-notifications"] as const,
  financeJobContext: (jobIdsKey: string) =>
    ["staff-dashboard", "finance", "job-context", jobIdsKey] as const,
} as const;
