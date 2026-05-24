import { FlaskConical, TestTube, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import {
  canAccessStaffRoute,
  type StaffRouteKey,
} from "@/lib/staff-route-access";
<<<<<<< HEAD
import { isStaffAnalyst } from "@/lib/staff-permissions";
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import { useAuthStore } from "@/stores/auth-store";

const linkClass =
  "flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30";

type QuickItem = {
  routeKey: StaffRouteKey;
  to: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

const ITEMS: QuickItem[] = [
  {
    routeKey: "laboratory",
    to: "/staff/laboratory",
    title: "Laboratory",
<<<<<<< HEAD
    subtitle: "Jobs, assignments, analyst tab",
    icon: FlaskConical,
  },
  {
    routeKey: "analyst",
    to: "/staff/analyst",
    title: "Analyst",
    subtitle: "Analyst workspace & assignments",
=======
    subtitle: "Jobs, catalog, assignments",
    icon: FlaskConical,
  },
  {
    routeKey: "samples",
    to: "/staff/samples",
    title: "Samples",
    subtitle: "Register and track samples",
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
    icon: TestTube,
  },
  {
    routeKey: "profile",
    to: "/staff/profile",
<<<<<<< HEAD
    title: "Profile & settings",
    subtitle: "Contact, security, preferences",
=======
    title: "Profile",
    subtitle: "Contact details",
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
    icon: User,
  },
  {
    routeKey: "users",
    to: "/staff/users",
    title: "Users",
    subtitle: "Accounts and roles",
    icon: Users,
  },
];

export function StaffDashboardQuickLinks() {
  const user = useAuthStore((s) => s.user);
<<<<<<< HEAD
  const items = ITEMS.filter((item) => canAccessStaffRoute(item.routeKey, user)).map(
    (item) => {
      if (item.routeKey === "analyst" && isStaffAnalyst(user)) {
        return {
          ...item,
          title: "Analyst bench",
          subtitle: "Blind listing (read-only for your role)",
        };
      }
      return item;
    },
  );
=======
  const items = ITEMS.filter((item) => canAccessStaffRoute(item.routeKey, user));
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9

  return (
    <section aria-labelledby="quick-links-heading">
      <h3 id="quick-links-heading" className="mb-3 text-sm font-medium">
        Shortcuts
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ to, title, subtitle, icon: Icon }) => (
          <Link key={to} to={to} className={linkClass}>
            <Icon className="size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
