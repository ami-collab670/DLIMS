import { Link } from "react-router-dom";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { getDashboardPath } from "@/lib/dashboard-path";
import { useAuthStore } from "@/stores/auth-store";

export function Header() {
  const { user, ready, clearSession } = useAuthStore();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
      <Link
        to="/"
        className="text-xl font-semibold tracking-tight hover:opacity-90"
      >
        LSIMS
      </Link>

      <div className="flex items-center gap-2">
        {ready && user ? (
          <>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to={getDashboardPath(user)}>Dashboard</Link>
            </Button>
            <NotificationBell />
            <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => clearSession()}
            >
              Sign out
            </Button>
          </>
        ) : null}
        {ready && !user ? (
          <>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button type="button" size="sm" asChild>
              <Link to="/signup">Sign up</Link>
            </Button>
          </>
        ) : null}
        <ThemeToggler />
      </div>
    </header>
  );
}
