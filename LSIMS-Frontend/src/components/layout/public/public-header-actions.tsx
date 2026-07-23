import { Link } from "react-router-dom";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { getDashboardPath, ROUTES } from "@/lib/routing";
import type { AuthUser } from "@/types/auth";

export function PublicHeaderActions({
  user,
  ready,
  onNavigate,
  clearSession,
  compact = false,
}: {
  user: AuthUser | null;
  ready: boolean;
  onNavigate?: () => void;
  clearSession: () => void;
  compact?: boolean;
}) {
  if (!ready) return null;

  if (user) {
    return (
      <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-2"}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
          className={compact ? "w-full justify-start" : undefined}
        >
          <Link to={getDashboardPath(user)} onClick={onNavigate}>
            Dashboard
          </Link>
        </Button>
        {!compact ? <NotificationBell /> : null}
        {!compact ? (
          <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline">
            {user.email}
          </span>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            clearSession();
            onNavigate?.();
          }}
          className={compact ? "w-full justify-start" : undefined}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        asChild
        className={compact ? "w-full justify-start" : undefined}
      >
        <Link to={ROUTES.login} onClick={onNavigate}>
          Sign in
        </Link>
      </Button>
      <Button
        type="button"
        size="sm"
        asChild
        className={compact ? "w-full justify-start" : undefined}
      >
        <Link to={ROUTES.signup} onClick={onNavigate}>
          Get started
        </Link>
      </Button>
    </div>
  );
}
