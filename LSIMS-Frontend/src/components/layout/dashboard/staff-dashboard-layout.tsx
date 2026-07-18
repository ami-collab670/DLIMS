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
  Shield,
  TestTube,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { BreadcrumbSegmentsProvider } from "@/components/navigation/breadcrumb-segments-context";
import { StaffPageNavigation } from "@/components/navigation/staff-page-navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  canAccessStaffRoute,
  type StaffRouteKey,
} from "@/lib/staff-route-access";
import { getStaffNavItemLabel } from "@/lib/staff-nav-meta";
import { staffRoleName } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

type NavItem = {
  routeKey: StaffRouteKey;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};

const STAFF_NAV_ITEMS: NavItem[] = [
  { routeKey: "dashboard", to: "/staff", icon: LayoutDashboard, end: true },
  { routeKey: "laboratory", to: "/staff/laboratory", icon: FlaskConical },
  {
    routeKey: "inventory",
    to: "/staff/inventory",
    icon: Package,
  },
  { routeKey: "analyst", to: "/staff/analyst", icon: TestTube },
  { routeKey: "results", to: "/staff/results", icon: ClipboardList },
  { routeKey: "qc", to: "/staff/qc", icon: BadgeCheck },
  { routeKey: "reports", to: "/staff/reports", icon: FileText },
  { routeKey: "finance", to: "/staff/finance", icon: Landmark },
  { routeKey: "scheduling", to: "/staff/scheduling", icon: CalendarClock },
  { routeKey: "instruments", to: "/staff/instruments", icon: Microscope },
  { routeKey: "compliance", to: "/staff/compliance", icon: Shield },
  { routeKey: "notifications", to: "/staff/notifications", icon: Bell },
  { routeKey: "users", to: "/staff/users", icon: Users },
  { routeKey: "profile", to: "/staff/profile", icon: User },
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
          {navItems.map(({ to, routeKey, icon: Icon, end = false }) => (
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
              {getStaffNavItemLabel(routeKey, user)}
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
          <BreadcrumbSegmentsProvider>
            <StaffPageNavigation />
            <div className="mt-4">
              <Outlet />
            </div>
          </BreadcrumbSegmentsProvider>
        </main>
      </div>
    </div>
  );
}
