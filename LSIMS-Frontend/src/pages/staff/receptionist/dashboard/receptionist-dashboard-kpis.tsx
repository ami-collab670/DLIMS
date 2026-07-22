import { staffFinanceTabUrl, staffPath } from "@/lib/staff";
import {
  Bell,
  ClipboardList,
  Landmark,
  Loader2,
  MessageSquareWarning,
  Percent,
  TestTube,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { useReceptionistDashboardKpis } from "@/features/staff/hooks";

type KpiCardProps = {
  label: string;
  value: number | string;
  href: string;
  icon: LucideIcon;
  loading?: boolean;
  hint?: string;
};

function KpiCard({ label, value, href, icon: Icon, loading, hint }: KpiCardProps) {
  return (
    <Link
      to={href}
      className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary">
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </div>
      <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tabular-nums">
        {loading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          value
        )}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Link>
  );
}

export function ReceptionistKpiGrid() {
  const { data: kpis, isLoading } = useReceptionistDashboardKpis();

  return (
    <section aria-labelledby="receptionist-kpi-heading">
      <h3 id="receptionist-kpi-heading" className="mb-3 text-sm font-medium">
        Reception desk overview
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard
          label="Pending finance clearance"
          value={kpis?.pendingFinance ?? 0}
          href={staffPath("finance")}
          icon={Landmark}
          loading={isLoading}
          hint="Jobs awaiting invoice or payment"
        />
        <KpiCard
          label="Awaiting payment"
          value={kpis?.awaitingPayment ?? 0}
          href={staffPath("finance")}
          icon={ClipboardList}
          loading={isLoading}
          hint="Unpaid or no invoice yet"
        />
        <KpiCard
          label="Samples today"
          value={kpis?.todaysSamples ?? 0}
          href={staffPath("laboratory")}
          icon={TestTube}
          loading={isLoading}
        />
        <KpiCard
          label="Unread notifications"
          value={kpis?.unreadNotifications ?? 0}
          href={staffPath("notifications")}
          icon={Bell}
          loading={isLoading}
        />
        <KpiCard
          label="Open complaints"
          value={kpis?.openComplaints ?? 0}
          href={staffPath("clients", { tab: "complaints" })}
          icon={MessageSquareWarning}
          loading={isLoading}
        />
        <KpiCard
          label="Active clients"
          value={kpis?.activeClients ?? 0}
          href={staffPath("clients")}
          icon={Users}
          loading={isLoading}
        />
        <KpiCard
          label="Pending discount requests"
          value={kpis?.pendingDiscounts ?? 0}
          href={staffFinanceTabUrl("discounts")}
          icon={Percent}
          loading={isLoading}
        />
      </div>
    </section>
  );
}
