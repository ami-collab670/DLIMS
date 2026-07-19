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
  | "analyst"
  | "results"
  | "qc"
  | "reports"
  | "finance"
  | "inventory"
  | "scheduling"
  | "instruments"
  | "compliance"
  | "notifications"
  | "clients"
  | "users"
  | "profile"
  | "settings";

const ALL_STAFF_ROUTES: StaffRouteKey[] = [
  "dashboard",
  "laboratory",
  "clients",
  "analyst",
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

const PROFILE_SETTINGS: StaffRouteKey[] = ["profile", "settings"];

/** Shared shell for every internal staff account. */
const STAFF_SHELL: StaffRouteKey[] = [
  "dashboard",
  "notifications",
  ...PROFILE_SETTINGS,
];

/** All operational pages except admin-only user management. */
const OPS_ALL: StaffRouteKey[] = ALL_STAFF_ROUTES.filter((k) => k !== "users");

/** Reception desk: intake, clients, finance coordination (read-only invoices). */
const RECEPTIONIST_ROUTES: StaffRouteKey[] = [
  "dashboard",
  "notifications",
  "profile",
  "laboratory",
  "clients",
  "finance",
];

/**
 * Analyst: assigned samples, analysis results, calibrations.
 * Aligns with `analysis_results_visible_to` / blind sample scope in backend policies.
 */
const ANALYST_ROUTES: StaffRouteKey[] = [
  ...STAFF_SHELL,
  "laboratory",
  "analyst",
  "results",
  "scheduling",
  "instruments",
];

/** Lab technician: preparation bench only (no analysis/QC visibility). */
const LAB_TECHNICIAN_ROUTES: StaffRouteKey[] = [
  ...STAFF_SHELL,
  "laboratory",
  "analyst",
  "scheduling",
];

/**
 * Lab director: discount approvals, complaints, scheduling oversight.
 * Aligns with `discount_approvals_visible_to` and `complaint_records_visible_to`.
 */
const LAB_DIRECTOR_ROUTES: StaffRouteKey[] = [
  ...STAFF_SHELL,
  "laboratory",
  "results",
  "qc",
  "reports",
  "finance",
  "scheduling",
  "compliance",
];

/** QC manager: department-scoped analysis review and complaint handling. */
const QC_MANAGER_ROUTES: StaffRouteKey[] = [
  ...STAFF_SHELL,
  "laboratory",
  "results",
  "qc",
  "reports",
  "scheduling",
  "compliance",
];

/** Finance desk: payment records and discount requests only. */
const FINANCE_ROUTES: StaffRouteKey[] = [
  ...STAFF_SHELL,
  "finance",
];

/** Procurement: test catalog / inventory management. */
const PROCUREMENT_ROUTES: StaffRouteKey[] = [
  ...STAFF_SHELL,
  "laboratory",
  "inventory",
  "scheduling",
];

/** Ministry coordinator: read-oriented oversight routes. */
const MINISTRY_COORDINATOR_ROUTES: StaffRouteKey[] = [
  ...STAFF_SHELL,
  "reports",
  "compliance",
  "scheduling",
];

/** Auditor: finance discounts and complaints (`auditor` in backend visibility policies). */
const AUDITOR_ROUTES: StaffRouteKey[] = [
  ...STAFF_SHELL,
  "reports",
  "finance",
  "compliance",
  "scheduling",
];

/**
 * Maps LSIMS `role_detail.role_name` → allowed areas.
 * Mirrors backend visibility in `laboratory/policies.py` where applicable.
 */
const ROUTES_BY_ROLE_NAME: Record<string, readonly StaffRouteKey[]> = {
  admin: ALL_STAFF_ROUTES,
  receptionist: RECEPTIONIST_ROUTES,
  analyst: ANALYST_ROUTES,
  lab_technician: LAB_TECHNICIAN_ROUTES,
  lab_director: LAB_DIRECTOR_ROUTES,
  qc_manager: QC_MANAGER_ROUTES,
  finance: FINANCE_ROUTES,
  procurement: PROCUREMENT_ROUTES,
  ministry_coordinator: MINISTRY_COORDINATOR_ROUTES,
  auditor: AUDITOR_ROUTES,
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
