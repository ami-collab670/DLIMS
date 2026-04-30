import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/stores/auth-store";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuthStore();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
