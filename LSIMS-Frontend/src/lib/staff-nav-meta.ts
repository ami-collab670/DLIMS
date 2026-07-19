import type { AuthUser } from "@/types/auth";

import {
  getStaffNavRouteKeys,
  type StaffRouteKey,
} from "@/lib/staff-route-access";
import { isReceptionist, isStaffAnalyst } from "@/lib/staff-permissions";

/** Human-readable sidebar labels — keep in sync with staff-dashboard-layout nav. */
export const STAFF_ROUTE_LABELS: Record<StaffRouteKey, string> = {
  dashboard: "Dashboard",
  laboratory: "Laboratory",
  analyst: "Analyst",
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

/** Sidebar / nav label — may vary by role (analyst bench wording). */
export function getStaffNavItemLabel(
  routeKey: StaffRouteKey,
  user: AuthUser | null,
): string {
  if (routeKey === "analyst" && isStaffAnalyst(user)) {
    return "Analyst bench";
  }
  if (routeKey === "laboratory" && isReceptionist(user)) {
    return "Sample intake";
  }
  return STAFF_ROUTE_LABELS[routeKey];
}

const PROFILE_AREA_KEYS = new Set<StaffRouteKey>(["profile", "settings"]);

/** Workspace area labels this user can access (excludes profile/settings). */
export function getAccessibleStaffAreaLabels(user: AuthUser | null): string[] {
  return getStaffNavRouteKeys(user)
    .filter((key) => !PROFILE_AREA_KEYS.has(key))
    .map((key) => getStaffNavItemLabel(key, user));
}
