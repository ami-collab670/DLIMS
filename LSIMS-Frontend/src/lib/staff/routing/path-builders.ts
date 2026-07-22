import type { StaffRouteKey } from "@/lib/staff/route-access";

import {
  ROUTES,
  type StaffFinanceTab,
  type StaffPathKey,
} from "@/lib/routing/app-routes";
import { withQuery } from "@/lib/routing/with-query";

const STAFF_ROUTE_PATHS: Record<StaffRouteKey, string> = {
  dashboard: ROUTES.staff.root,
  laboratory: ROUTES.staff.laboratory,
  analyst: ROUTES.staff.analyst,
  prep: ROUTES.staff.prep,
  results: ROUTES.staff.results,
  qc: ROUTES.staff.qc.root,
  reports: ROUTES.staff.reports,
  finance: ROUTES.staff.finance,
  inventory: ROUTES.staff.inventory,
  scheduling: ROUTES.staff.scheduling,
  instruments: ROUTES.staff.instruments,
  compliance: ROUTES.staff.compliance,
  notifications: ROUTES.staff.notifications,
  clients: ROUTES.staff.clients,
  users: ROUTES.staff.users,
  profile: ROUTES.staff.profile,
  settings: ROUTES.staff.settings,
};

export function staffPath(
  routeKey: StaffRouteKey,
  query?: Record<string, string>,
): string {
  return withQuery(STAFF_ROUTE_PATHS[routeKey], query);
}

export function staffSegmentPath(
  segment: StaffPathKey,
  query?: Record<string, string>,
): string {
  const path = ROUTES.staff[segment];
  if (typeof path === "string") {
    return withQuery(path, query);
  }
  return withQuery(ROUTES.staff.root, query);
}

export function staffFinanceTabUrl(tab: StaffFinanceTab): string {
  return staffPath("finance", { tab });
}
