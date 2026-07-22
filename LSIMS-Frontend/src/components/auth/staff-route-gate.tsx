import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { ROUTES } from "@/lib/routing";
import { canAccessStaffRoute, type StaffRouteKey } from "@/lib/staff";
import { useAuthStore } from "@/stores/auth-store";

type Props = {
  routeKey: StaffRouteKey;
  children: ReactNode;
};

/**
 * Enforces staff sidebar / URL access matrix in `staff-route-access.ts`.
 */
export function StaffRouteGate({ routeKey, children }: Props) {
  const user = useAuthStore((s) => s.user);
  const allowed = user ? canAccessStaffRoute(routeKey, user) : false;

  if (!user) return null;

  if (!allowed) {
    return <Navigate to={ROUTES.staff.root} replace />;
  }

  return children;
}
