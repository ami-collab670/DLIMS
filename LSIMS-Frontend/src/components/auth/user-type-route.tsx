import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { getDashboardPath, ROUTES } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth-store";

/** Only `internal` (staff) users. External users are sent to the client app. */
export function StaffOnlyRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  if (user.user_type !== "internal") {
    return <Navigate to={ROUTES.client.root} replace />;
  }

  return children;
}

/** Only `external` (client) users. Internal users are sent to the staff app. */
export function ClientOnlyRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  if (user.user_type !== "external") {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
}
