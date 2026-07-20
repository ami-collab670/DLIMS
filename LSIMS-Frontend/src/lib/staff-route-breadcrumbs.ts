import { getStaffNavItemLabel } from "@/lib/staff-nav-meta";
import type { StaffRouteKey } from "@/lib/staff-route-access";
import type { AuthUser } from "@/types/auth";

const STAFF_HOME = "/staff";

const STAFF_ROUTE_KEYS = new Set<StaffRouteKey>([
  "dashboard",
  "laboratory",
  "analyst",
  "prep",
  "results",
  "qc",
  "reports",
  "finance",
  "inventory",
  "scheduling",
  "instruments",
  "compliance",
  "notifications",
  "clients",
  "users",
  "profile",
  "settings",
]);

export type RouteBreadcrumbSegment = {
  label: string;
  href: string;
};

function parseStaffRouteKey(pathname: string): StaffRouteKey | null {
  const normalized =
    pathname === STAFF_HOME || pathname === `${STAFF_HOME}/`
      ? "dashboard"
      : pathname.replace(/^\/staff\/?/, "").split("/")[0];

  if (!normalized || normalized === "dashboard") {
    return normalized === "dashboard" ? "dashboard" : null;
  }

  return STAFF_ROUTE_KEYS.has(normalized as StaffRouteKey)
    ? (normalized as StaffRouteKey)
    : null;
}

function staffHrefForRouteKey(routeKey: StaffRouteKey): string {
  return routeKey === "dashboard" ? STAFF_HOME : `${STAFF_HOME}/${routeKey}`;
}

export function getStaffRouteBreadcrumbs(
  pathname: string,
  user: AuthUser | null,
): RouteBreadcrumbSegment[] {
  const routeKey = parseStaffRouteKey(pathname);
  const dashboardSegment: RouteBreadcrumbSegment = {
    label: getStaffNavItemLabel("dashboard", user),
    href: STAFF_HOME,
  };

  if (!routeKey || routeKey === "dashboard") {
    return [dashboardSegment];
  }

  return [
    dashboardSegment,
    {
      label: getStaffNavItemLabel(routeKey, user),
      href: staffHrefForRouteKey(routeKey),
    },
  ];
}
