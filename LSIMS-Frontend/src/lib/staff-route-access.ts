import type { AuthUser } from "@/types/auth";

import {
  canManageJobsAndSamples,
  isStaffAdmin,
  staffRoleName,
} from "@/lib/staff-permissions";

/** Route segment after `/staff` (index = dashboard). */
export type StaffRouteKey =
  | "dashboard"
  | "laboratory"
  | "samples"
  | "results"
  | "qc"
  | "reports"
  | "finance"
  | "inventory"
  | "scheduling"
  | "instruments"
  | "compliance"
  | "notifications"
  | "users"
  | "profile"
  | "settings";

const ALL_STAFF_ROUTES: StaffRouteKey[] = [
  "dashboard",
  "laboratory",
  "samples",
  "results",
  "qc",
  "reports",
  "finance",
  "inventory",
  "scheduling",
  "instruments",
  "compliance",
  "notifications",
  "users",
  "profile",
  "settings",
];

/** All operational pages except admin-only user management. */
const OPS_ALL: StaffRouteKey[] = ALL_STAFF_ROUTES.filter((k) => k !== "users");

/**
 * Analyst: laboratory visibility, assigned samples, analysis-oriented pages.
 * Excludes finance/QC hubs (workflow ownership elsewhere) per typical bench separation.
 */
const ANALYST_ROUTES: StaffRouteKey[] = [
  "dashboard",
  "laboratory",
  "samples",
  "results",
  "scheduling",
  "inventory",
  "instruments",
  "compliance",
  "notifications",
  "profile",
  "settings",
];

/**
 * Maps LSIMS `role_detail.role_name` → allowed areas.
 * Aligns with backend read scopes (jobs/samples/catalog) and write rules (admin/receptionist).
 */
const ROUTES_BY_ROLE_NAME: Record<string, readonly StaffRouteKey[]> = {
  admin: ALL_STAFF_ROUTES,
  receptionist: OPS_ALL,
  analyst: ANALYST_ROUTES,
  qc_manager: OPS_ALL,
  finance: OPS_ALL,
  procurement: OPS_ALL,
  ministry_coordinator: OPS_ALL,
  auditor: OPS_ALL,
};

function routesForUser(user: AuthUser | null): readonly StaffRouteKey[] | null {
  if (!user?.is_active) return null;
  if (user.user_type !== "internal") return null;
  if (user.is_superuser) return ALL_STAFF_ROUTES;
  const r = staffRoleName(user);
  if (!r) return OPS_ALL;
  return ROUTES_BY_ROLE_NAME[r] ?? OPS_ALL;
}

export function canAccessStaffRoute(
  routeKey: StaffRouteKey,
  user: AuthUser | null,
): boolean {
  const allowed = routesForUser(user);
  if (!allowed) return false;
  return allowed.includes(routeKey);
}

/** Pages where job PATCH / operational release is meaningful (backend: admin + receptionist). */
export function canManageOperationalQueues(user: AuthUser | null): boolean {
  return canManageJobsAndSamples(user);
}

/** User management: backend IsAdmin. */
export function canAccessUserManagement(user: AuthUser | null): boolean {
  return isStaffAdmin(user);
}

export function getStaffNavRouteKeys(user: AuthUser | null): StaffRouteKey[] {
  const allowed = routesForUser(user);
  if (!allowed) return ["dashboard", "profile", "settings"];
  return [...allowed];
}
