import { Bell, ClipboardList, FileText, Home, User } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { to: "/client", label: "Home", icon: Home, end: true },
  { to: "/client/requests", label: "My requests", icon: FileText, end: false },
<<<<<<< HEAD
  // { to: "/client/results", label: "My samples", icon: ClipboardList, end: false },
  // { to: "/client/notifications", label: "Notifications", icon: Bell, end: false },
  { to: "/client/profile", label: "Profile & settings", icon: User, end: false },
=======
  { to: "/client/results", label: "My samples", icon: ClipboardList, end: false },
  // { to: "/client/notifications", label: "Notifications", icon: Bell, end: false },
  { to: "/client/profile", label: "Profile", icon: User, end: false },
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
];

export function ClientDashboardLayout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink
            to="/client"
            className="text-lg font-semibold tracking-tight hover:opacity-90"
          >
            LSIMS
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-[160px] truncate text-xs text-muted-foreground lg:inline">
              {user?.email}
            </span>
            <NotificationBell />
            <ThemeToggler />
            <Button type="button" variant="outline" size="sm" onClick={() => clearSession()}>
              Sign out
            </Button>
          </div>
        </div>

        <nav className="flex border-t border-border px-4 py-2 md:hidden">
          <div className="flex w-full justify-around gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
