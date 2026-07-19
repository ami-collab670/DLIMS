import {
  FlaskConical,
  Landmark,
  Percent,
  TestTube,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

const linkClass =
  "flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30";

type ActionItem = {
  to: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

const ACTIONS: ActionItem[] = [
  {
    to: "/staff/laboratory",
    title: "New job intake",
    subtitle: "Register a client job order",
    icon: FlaskConical,
  },
  {
    to: "/staff/laboratory",
    title: "Register sample",
    subtitle: "Select a job to add samples",
    icon: TestTube,
  },
  {
    to: "/staff/clients",
    title: "Clients",
    subtitle: "Directory and job history",
    icon: Users,
  },
  {
    to: "/staff/finance?tab=discounts",
    title: "Request discount",
    subtitle: "Submit a waiver for director review",
    icon: Percent,
  },
  {
    to: "/staff/finance",
    title: "Finance status",
    subtitle: "View invoices (read-only)",
    icon: Landmark,
  },
];

export function ReceptionistQuickActions() {
  return (
    <section aria-labelledby="receptionist-actions-heading">
      <h3 id="receptionist-actions-heading" className="mb-3 text-sm font-medium">
        Quick actions
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map(({ to, title, subtitle, icon: Icon }) => (
          <Link key={`${to}-${title}`} to={to} className={linkClass}>
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
