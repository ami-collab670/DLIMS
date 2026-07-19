import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  Landmark,
  Loader2,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchJobOrders } from "@/features/jobs/api";
import { fetchDiscountApprovals } from "@/features/laboratory/discount-approvals-api";
import { fetchUnreadNotificationCount } from "@/features/notifications/api";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { fetchAwaitingFinanceJobs } from "@/pages/staff/receptionist/shared/fetch-awaiting-finance-jobs";
import { useAuthStore } from "@/stores/auth-store";

import {
  countPaidInWindow,
  fetchAllFinancialRecords,
  formatMoney,
  invoiceByJobMap,
  revenueCollectedInDays,
  sumOutstanding,
} from "./finance-dashboard-utils";

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

export function FinanceKpiGrid() {
  const userEmail = useAuthStore((s) => s.user?.email?.toLowerCase() ?? "");

  const { data: kpis, isLoading } = useQuery({
    queryKey: dashboardKeys.financeKpis,
    queryFn: async () => {
      const [awaitingJobs, allRecords, holdJobs, discountsData, unreadCount] =
        await Promise.all([
          fetchAwaitingFinanceJobs(),
          fetchAllFinancialRecords(),
          fetchJobOrders({ page: 1, current_status: "finance_hold", is_cancelled: false }),
          fetchDiscountApprovals({ page: 1, status: "pending" }),
          fetchUnreadNotificationCount(),
        ]);

      const invoiceMap = invoiceByJobMap(allRecords);
      const awaitingFirstInvoice = awaitingJobs.filter((j) => !invoiceMap.has(j.id)).length;
      const { today: paidToday, week: paidThisWeek } = countPaidInWindow(allRecords, true);
      const revenue7d = revenueCollectedInDays(allRecords, 7);

      const myPendingDiscounts = discountsData.results.filter(
        (d) => !userEmail || !d.requested_by || d.requested_by.toLowerCase() === userEmail,
      ).length;

      return {
        awaitingFirstInvoice,
        outstandingTotal: sumOutstanding(allRecords),
        paidToday,
        paidThisWeek,
        revenue7d,
        financeHoldCount: holdJobs.count,
        pendingDiscounts: myPendingDiscounts,
        unreadNotifications: unreadCount,
      };
    },
    staleTime: 60_000,
  });

  return (
    <section aria-labelledby="finance-kpi-heading">
      <h3 id="finance-kpi-heading" className="mb-3 text-sm font-medium">
        Finance desk overview
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard
          label="Awaiting first invoice"
          value={kpis?.awaitingFirstInvoice ?? 0}
          href="/staff/finance"
          icon={Landmark}
          loading={isLoading}
          hint="Jobs with no invoice yet"
        />
        <KpiCard
          label="Outstanding amount"
          value={formatMoney(kpis?.outstandingTotal ?? 0)}
          href="/staff/finance"
          icon={Wallet}
          loading={isLoading}
          hint="All pending + partial invoices"
        />
        <KpiCard
          label="Revenue collected (7 days)"
          value={formatMoney(kpis?.revenue7d ?? 0)}
          href="/staff/finance?tab=reports"
          icon={TrendingUp}
          loading={isLoading}
          hint="Paid in the last week"
        />
        <KpiCard
          label="Paid today"
          value={kpis?.paidToday ?? 0}
          href="/staff/finance"
          icon={Landmark}
          loading={isLoading}
          hint={`${kpis?.paidThisWeek ?? 0} invoices this week`}
        />
        <KpiCard
          label="Finance hold"
          value={kpis?.financeHoldCount ?? 0}
          href="/staff#finance-hold-queue"
          icon={AlertCircle}
          loading={isLoading}
          hint="Blocked on payment"
        />
        <KpiCard
          label="Pending discount requests"
          value={kpis?.pendingDiscounts ?? 0}
          href="/staff/finance?tab=discounts"
          icon={Percent}
          loading={isLoading}
          hint="Awaiting director review"
        />
        <KpiCard
          label="Unread notifications"
          value={kpis?.unreadNotifications ?? 0}
          href="/staff/notifications"
          icon={Bell}
          loading={isLoading}
          hint="Read-only inbox"
        />
      </div>
    </section>
  );
}
