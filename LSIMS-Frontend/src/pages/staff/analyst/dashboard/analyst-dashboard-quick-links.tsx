import { staffPath } from "@/lib/staff";
import { Link } from "react-router-dom";
import { AlertCircle, FileEdit, TestTube } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  description: string;
  to: string;
};

function QuickLinkCard({ icon: Icon, label, description, to }: Props) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary">
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

export function AnalystDashboardQuickLinks() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Quick links</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLinkCard
          icon={TestTube}
          label="Open my samples"
          description="Enter results and submit to department QC."
          to={staffPath("analyst")}
        />
        <QuickLinkCard
          icon={AlertCircle}
          label="Needs resubmit"
          description="Rejected results returned for revision."
          to={staffPath("analyst", { resultState: "rejected" })}
        />
        <QuickLinkCard
          icon={FileEdit}
          label="Draft results"
          description="Continue work on saved drafts."
          to={staffPath("analyst", { resultState: "draft" })}
        />
      </div>
    </section>
  );
}
