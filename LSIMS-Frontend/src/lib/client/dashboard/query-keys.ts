/** React Query keys for the client dashboard (shared across sections). */
export const clientDashboardKeys = {
  activeJobCount: ["client-dashboard", "jobs", "active-count"] as const,
  allActiveJobs: ["client-dashboard", "jobs", "all-active"] as const,
  recentJobs: ["client-dashboard", "jobs", "recent"] as const,
  /** @deprecated Use allFinancialRecords */
  financialRecords: ["client-dashboard", "financial-records"] as const,
  allFinancialRecords: ["client-dashboard", "financial-records", "all"] as const,
  recentSamples: ["client-dashboard", "samples", "recent"] as const,
  completedJobCount: ["client-dashboard", "jobs", "completed-count"] as const,
  urgentJobCount: ["client-dashboard", "jobs", "urgent-count"] as const,
  openComplaints: ["client-dashboard", "complaints", "open-count"] as const,
  inReviewComplaints: ["client-dashboard", "complaints", "in-review-count"] as const,
  attentionComplaints: ["client-dashboard", "complaints", "attention"] as const,
  recentNotifications: ["client-dashboard", "notifications", "recent"] as const,
  unreadJobNotifications: ["client-dashboard", "notifications", "unread-job"] as const,
  unreadCount: ["client-dashboard", "notifications", "unread-count"] as const,
  profile: ["client-dashboard", "profile"] as const,
} as const;
