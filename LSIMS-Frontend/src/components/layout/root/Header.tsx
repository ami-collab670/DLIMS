import { Link, useLocation } from "react-router-dom";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { DEFAULT_SITE_SETTINGS } from "@/features/cms/defaults";
import { useSiteSettings } from "@/features/cms/hooks";
import { getDashboardPath, ROUTES } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth-store";

export function Header() {
  const { user, ready, clearSession } = useAuthStore();
  const { pathname } = useLocation();
  const { data: siteSettings } = useSiteSettings();

  const siteName = siteSettings?.siteName ?? DEFAULT_SITE_SETTINGS.siteName;
  const navLinks =
    siteSettings?.navLinks ?? [...DEFAULT_SITE_SETTINGS.navLinks];

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-6">
        <Link
          to={ROUTES.home}
          className="shrink-0 text-xl font-semibold tracking-tight hover:opacity-90"
        >
          {siteName}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Button
                key={link.path}
                type="button"
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link to={link.path}>{link.label}</Link>
              </Button>
            );
          })}
        </nav>
      </div>

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
              <Link to={ROUTES.login}>Sign in</Link>
            </Button>
            <Button type="button" size="sm" asChild>
              <Link to={ROUTES.signup}>Sign up</Link>
            </Button>
          </>
        ) : null}
        <ThemeToggler />
      </div>
    </header>
  );
}
