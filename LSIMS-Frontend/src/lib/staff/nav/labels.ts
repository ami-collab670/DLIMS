import type { StaffRouteKey } from "../route-access";

/** Staff route labels for the sidebar navigation. */
export const STAFF_ROUTE_LABELS: Record<StaffRouteKey, string> = {
  dashboard: "Dashboard",
  laboratory: "Laboratory",
  analyst: "Analyst",
  prep: "Preparation",
  results: "Results",
  qc: "QC",
  reports: "Reports",
  finance: "Finance",
  inventory: "Test catalog",
  scheduling: "Scheduling",
  instruments: "Instruments",
  compliance: "Compliance",
  notifications: "Notifications",
  clients: "Clients",
  users: "User management",
  profile: "Profile & settings",
  settings: "Profile & settings",
};
