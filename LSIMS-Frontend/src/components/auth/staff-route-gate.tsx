import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { canAccessStaffRoute, type StaffRouteKey } from "@/lib/staff-route-access";
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

  if (!user) return null;

  if (!canAccessStaffRoute(routeKey, user)) {
    return <Navigate to="/staff" replace />;
  }

  return children;
}
