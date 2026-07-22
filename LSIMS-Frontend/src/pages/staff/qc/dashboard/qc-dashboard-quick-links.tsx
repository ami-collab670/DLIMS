import { ROUTES } from "@/lib/routing";
import { staffPath } from "@/lib/staff";
import { Link } from "react-router-dom";
import { BadgeCheck, ClipboardList, History, TestTube, XCircle } from "lucide-react";
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

export function QcDashboardQuickLinks() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Quick links</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLinkCard
          icon={TestTube}
          label="Route samples"
          description="Assign analysts, create prep records, and optionally pre-assign lab techs."
          to={staffPath("laboratory", { tab: "analyst" })}
        />
        <QuickLinkCard
          icon={BadgeCheck}
          label="Open review desk"
          description="Approve or reject submitted results."
          to={ROUTES.staff.qc.root}
        />
        <QuickLinkCard
          icon={History}
          label="Decision history"
          description="Full audit log with filters."
          to={ROUTES.staff.qc.history}
        />
        <QuickLinkCard
          icon={XCircle}
          label="Rejected follow-up"
          description="Results returned to analysts."
          to={ROUTES.staff.qc.rejected}
        />
        <QuickLinkCard
          icon={ClipboardList}
          label="Jobs in QC"
          description="Monitor jobs awaiting final QC clearance."
          to={`${ROUTES.staff.qc.root}#jobs`}
        />
      </div>
    </section>
  );
}
