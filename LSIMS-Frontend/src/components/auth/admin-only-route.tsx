import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { getDashboardPath } from "@/lib/dashboard-path";
import { isStaffAdmin } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

/** LSIMS `admin` role or Django `is_superuser`. */
export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  if (!isStaffAdmin(user)) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
}
