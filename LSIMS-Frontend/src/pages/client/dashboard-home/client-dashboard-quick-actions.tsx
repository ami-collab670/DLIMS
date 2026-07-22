import { Link } from "react-router-dom";

import { CLIENT_QUICK_ACTION_ITEMS } from "@/lib/client";
import { clientPath } from "@/lib/routing";

const linkClass =
  "flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30";

export function ClientDashboardQuickActions() {
  return (
    <section aria-labelledby="client-quick-actions-heading">
      <h3 id="client-quick-actions-heading" className="mb-3 text-sm font-medium">
        Quick actions
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CLIENT_QUICK_ACTION_ITEMS.map(({ routeKey, title, subtitle, icon: Icon }) => (
          <Link key={routeKey} to={clientPath(routeKey)} className={linkClass}>
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
