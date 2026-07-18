/** React Query keys for the client dashboard (shared across sections). */
export const clientDashboardKeys = {
  activeJobCount: ["client-dashboard", "jobs", "active-count"] as const,
  allActiveJobs: ["client-dashboard", "jobs", "all-active"] as const,
  recentJobs: ["client-dashboard", "jobs", "recent"] as const,
  financialRecords: ["client-dashboard", "financial-records"] as const,
  openComplaints: ["client-dashboard", "complaints", "open-count"] as const,
  inReviewComplaints: ["client-dashboard", "complaints", "in-review-count"] as const,
  attentionComplaints: ["client-dashboard", "complaints", "attention"] as const,
  recentNotifications: ["client-dashboard", "notifications", "recent"] as const,
  unreadCount: ["client-dashboard", "notifications", "unread-count"] as const,
  profile: ["client-dashboard", "profile"] as const,
} as const;
