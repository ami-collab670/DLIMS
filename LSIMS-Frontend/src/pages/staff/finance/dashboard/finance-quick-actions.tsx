import { BarChart3, Landmark, Percent, Shield } from "lucide-react";
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
    to: "/staff/finance",
    title: "Invoices & payments",
    subtitle: "Create invoices and record payment",
    icon: Landmark,
  },
  {
    to: "/staff/finance?tab=discounts",
    title: "Discount requests",
    subtitle: "Submit waivers for director review",
    icon: Percent,
  },
  {
    to: "/staff/finance?tab=reports",
    title: "Finance reports",
    subtitle: "Revenue and receivables summary",
    icon: BarChart3,
  },
  {
    to: "/staff/finance?tab=compliance",
    title: "Payment compliance",
    subtitle: "Audit trail and dispute visibility",
    icon: Shield,
  },
];

export function FinanceQuickActions() {
  return (
    <section aria-labelledby="finance-quick-actions-heading">
      <h3 id="finance-quick-actions-heading" className="mb-3 text-sm font-medium">
        Quick actions
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map(({ to, title, subtitle, icon: Icon }) => (
          <Link key={to} to={to} className={linkClass}>
            <Icon className="size-5 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-sm font-medium">{title}</span>
              <span className="block text-xs text-muted-foreground">{subtitle}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
