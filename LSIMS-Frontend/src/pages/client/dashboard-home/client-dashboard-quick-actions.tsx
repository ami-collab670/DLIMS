import { Bell, FilePlus2, MessageSquare, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

const linkClass =
  "flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30";

const ITEMS: {
  to: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}[] = [
  {
    to: "/client/requests",
    title: "New request",
    subtitle: "Submit samples and select tests",
    icon: FilePlus2,
  },
  {
    to: "/client/results",
    title: "Track progress",
    subtitle: "Sample intake and test workflow",
    icon: TrendingUp,
  },
  {
    to: "/client/complaints",
    title: "Raise complaint",
    subtitle: "Payment, sample, or result issues",
    icon: MessageSquare,
  },
  {
    to: "/client/notifications",
    title: "Notifications",
    subtitle: "Job updates and lab messages",
    icon: Bell,
  },
];

export function ClientDashboardQuickActions() {
  return (
    <section aria-labelledby="client-shortcuts-heading">
      <h3 id="client-shortcuts-heading" className="mb-3 text-sm font-medium">
        Quick actions
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ to, title, subtitle, icon: Icon }) => (
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
