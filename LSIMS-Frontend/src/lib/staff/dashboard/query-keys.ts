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
  qcManagerJobIds: ["staff-dashboard", "qc-manager", "job-ids"] as const,
  qcManagerKpis: ["staff-dashboard", "qc-manager", "kpis"] as const,
  qcManagerQcQueue: ["staff-dashboard", "qc-manager", "qc-queue"] as const,
  qcManagerPrepBacklog: ["staff-dashboard", "qc-manager", "prep-backlog"] as const,
  qcManagerTeamRoster: ["staff-dashboard", "qc-manager", "team-roster"] as const,
  qcManagerComplaints: ["staff-dashboard", "qc-manager", "complaints"] as const,
  qcManagerAssignmentQueue: ["staff-dashboard", "qc-manager", "assignment-queue"] as const,
  qcManagerAnalystDirectory: (departmentId: string | null) =>
    ["staff-dashboard", "qc-manager", "analyst-directory", departmentId ?? "none"] as const,
  qcManagerLabTechDirectory: (departmentId: string | null) =>
    ["staff-dashboard", "qc-manager", "lab-tech-directory", departmentId ?? "none"] as const,
  qcDeskKpis: ["staff-dashboard", "qc-desk", "kpis"] as const,
  qcDeskInboxPreview: ["staff-dashboard", "qc-desk", "inbox-preview"] as const,
  qcDeskRecentDecisions: ["staff-dashboard", "qc-desk", "recent-decisions"] as const,
  analystDeskKpis: ["staff-dashboard", "analyst-desk", "kpis"] as const,
  analystDeskAssignedPreview: ["staff-dashboard", "analyst-desk", "assigned-preview"] as const,
  analystDeskRecentSubmissions: ["staff-dashboard", "analyst-desk", "recent-submissions"] as const,
  labTechDeskKpis: ["staff-dashboard", "lab-tech-desk", "kpis"] as const,
  labTechDeskQueuePreview: ["staff-dashboard", "lab-tech-desk", "queue-preview"] as const,
} as const;
