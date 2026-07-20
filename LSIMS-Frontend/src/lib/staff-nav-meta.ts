import type { AuthUser } from "@/types/auth";

import {
  getStaffNavRouteKeys,
  type StaffRouteKey,
} from "@/lib/staff-route-access";
import {
  isFinance,
  isLabDirector,
  isQcManager,
  isReceptionist,
  isStaffAdmin,
  isStaffAnalyst,
  isStaffLabTechnician,
  staffRoleName,
} from "@/lib/staff-permissions";

/** Human-readable sidebar labels — keep in sync with staff-dashboard-layout nav. */
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

/** Sidebar / nav label — may vary by role (analyst bench wording). */
export function getStaffNavItemLabel(
  routeKey: StaffRouteKey,
  user: AuthUser | null,
): string {
  if (routeKey === "analyst" && isStaffAnalyst(user)) {
    return "My samples";
  }
  if (routeKey === "prep" && isStaffLabTechnician(user)) {
    return "Preparation bench";
  }
  if (routeKey === "dashboard" && isStaffAnalyst(user)) {
    return "Analyst dashboard";
  }
  if (routeKey === "dashboard" && isStaffLabTechnician(user)) {
    return "Prep dashboard";
  }
  if (routeKey === "laboratory" && isReceptionist(user)) {
    return "Sample intake";
  }
  if (routeKey === "laboratory" && isQcManager(user)) {
    return "Route samples";
  }
  if (routeKey === "dashboard" && isFinance(user)) {
    return "Finance desk";
  }
  if (routeKey === "dashboard" && isQcManager(user)) {
    return "QC dashboard";
  }
  if (routeKey === "qc" && isQcManager(user)) {
    return "QC review";
  }
  if (routeKey === "finance" && isFinance(user)) {
    return "Invoices & payments";
  }
  return STAFF_ROUTE_LABELS[routeKey];
}

/** Main header title for the staff workspace shell. */
export function getStaffWorkspaceTitle(user: AuthUser | null): string {
  if (isReceptionist(user)) return "Receptionist dashboard";
  if (isFinance(user)) return "Finance desk";
  if (isQcManager(user)) return "Quality control";
  if (isStaffAnalyst(user)) return "Analyst bench";
  if (isStaffLabTechnician(user)) return "Preparation bench";
  if (staffRoleName(user) === "auditor") return "Compliance audit";
  if (isLabDirector(user)) return "Laboratory director";
  if (isStaffAdmin(user)) return "Admin workspace";
  return "Staff workspace";
}

/** Role label shown in the staff header (right side). */
export function getStaffRoleStrip(user: AuthUser | null): string | null {
  if (!user) return null;
  return (
    user.role_detail?.display_name ??
    staffRoleName(user)?.replace(/_/g, " ") ??
    (user.is_superuser ? "Superuser" : null)
  );
}

const PROFILE_AREA_KEYS = new Set<StaffRouteKey>(["profile", "settings"]);

/** Workspace area labels this user can access (excludes profile/settings). */
export function getAccessibleStaffAreaLabels(user: AuthUser | null): string[] {
  return getStaffNavRouteKeys(user)
    .filter((key) => !PROFILE_AREA_KEYS.has(key))
    .map((key) => getStaffNavItemLabel(key, user));
}
