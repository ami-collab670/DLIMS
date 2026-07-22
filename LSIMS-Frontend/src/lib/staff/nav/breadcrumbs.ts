import { ROUTES } from "@/lib/routing";
import type { AuthUser } from "@/types/auth";

import { getStaffNavItemLabel } from "./item-label";
import { STAFF_ROUTE_KEYS, type StaffRouteKey } from "../route-access";

const STAFF_HOME = ROUTES.staff.root;

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
