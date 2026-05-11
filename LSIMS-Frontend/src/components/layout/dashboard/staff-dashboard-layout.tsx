import {
  BadgeCheck,
  Bell,
  CalendarClock,
  ClipboardList,
  FileText,
  FlaskConical,
  Landmark,
  LayoutDashboard,
  Microscope,
  Package,
  Settings,
  Shield,
  TestTube,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  canAccessStaffRoute,
  type StaffRouteKey,
} from "@/lib/staff-route-access";
import { staffRoleName } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

type NavItem = {
  routeKey: StaffRouteKey;
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const STAFF_NAV_ITEMS: NavItem[] = [
  { routeKey: "dashboard", to: "/staff", label: "Dashboard", icon: LayoutDashboard, end: true },
  { routeKey: "laboratory", to: "/staff/laboratory", label: "Laboratory", icon: FlaskConical },
  { routeKey: "samples", to: "/staff/samples", label: "Samples", icon: TestTube },
  { routeKey: "results", to: "/staff/results", label: "Results", icon: ClipboardList },
  { routeKey: "qc", to: "/staff/qc", label: "QC", icon: BadgeCheck },
  { routeKey: "reports", to: "/staff/reports", label: "Reports", icon: FileText },
  { routeKey: "finance", to: "/staff/finance", label: "Finance", icon: Landmark },
  {
    routeKey: "inventory",
    to: "/staff/inventory",
    label: "Catalog / inventory",
    icon: Package,
  },
  // { routeKey: "scheduling", to: "/staff/scheduling", label: "Scheduling", icon: CalendarClock },
  // { routeKey: "instruments", to: "/staff/instruments", label: "Instruments", icon: Microscope },
  { routeKey: "compliance", to: "/staff/compliance", label: "Compliance", icon: Shield },
  { routeKey: "notifications", to: "/staff/notifications", label: "Notifications", icon: Bell },
  { routeKey: "users", to: "/staff/users", label: "User management", icon: Users },
  { routeKey: "profile", to: "/staff/profile", label: "Profile", icon: User },
  { routeKey: "settings", to: "/staff/settings", label: "Settings", icon: Settings },
];

export function StaffDashboardLayout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);

  const navItems = STAFF_NAV_ITEMS.filter((item) =>
    canAccessStaffRoute(item.routeKey, user),
  );

  const roleStrip =
    user?.role_detail?.display_name ??
    staffRoleName(user)?.replace(/_/g, " ") ??
    (user?.is_superuser ? "Superuser" : null);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground max-h-screen overflow-y-auto sticky top-0">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <NavLink
            to="/staff"
            className="text-lg font-semibold tracking-tight text-sidebar-foreground hover:opacity-90"
          >
            LSIMS
          </NavLink>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {navItems.map(({ to, label, icon: Icon, end = false }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <p className="mb-2 truncate px-1 text-xs text-muted-foreground">
            {user?.email}
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggler />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 border-sidebar-border"
              onClick={() => clearSession()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-6">
          <h1 className="text-sm font-medium text-muted-foreground">Staff workspace</h1>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[160px] truncate text-xs text-muted-foreground lg:inline">
              {user?.email}
            </span>
          {roleStrip ? (
            <p className="truncate text-xs text-muted-foreground capitalize tabular-nums">
              {roleStrip}
            </p>
          ) : null}
          <NotificationBell />
          <ThemeToggler />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
