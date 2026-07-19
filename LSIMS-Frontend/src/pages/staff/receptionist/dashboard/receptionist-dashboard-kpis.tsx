import { useQuery } from "@tanstack/react-query";
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

import { fetchLabClients } from "@/features/accounts/lab-clients-api";
import { fetchComplaints } from "@/features/laboratory/complaints-api";
import { fetchDiscountApprovals } from "@/features/laboratory/discount-approvals-api";
import { fetchFinancialRecords } from "@/features/laboratory/financial-records-api";
import { fetchSamples } from "@/features/laboratory/staff-api";
import { fetchUnreadNotificationCount } from "@/features/notifications/api";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { fetchAwaitingFinanceJobs } from "@/pages/staff/receptionist/shared/fetch-awaiting-finance-jobs";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function needsPaymentAttention(
  jobId: string,
  invoiceByJob: Map<string, { payment_status: string }>,
): boolean {
  const invoice = invoiceByJob.get(jobId);
  if (!invoice) return true;
  return invoice.payment_status !== "paid";
}

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
  const { data: kpis, isLoading } = useQuery({
    queryKey: dashboardKeys.receptionistKpis,
    queryFn: async () => {
      const [
        awaitingJobs,
        financialData,
        samplesData,
        unreadCount,
        complaintsData,
        clients,
        discountsData,
      ] = await Promise.all([
        fetchAwaitingFinanceJobs(),
        fetchFinancialRecords({ page: 1 }),
        fetchSamples({ page: 1, page_size: 100 }),
        fetchUnreadNotificationCount(),
        fetchComplaints({ page: 1, status: "open" }),
        fetchLabClients(),
        fetchDiscountApprovals({ page: 1, status: "pending" }),
      ]);

      const invoiceByJob = new Map<string, { payment_status: string }>();
      for (const r of financialData.results) {
        if (!invoiceByJob.has(r.job)) {
          invoiceByJob.set(r.job, { payment_status: r.payment_status });
        }
      }

      const awaitingPayment = awaitingJobs.filter((j) =>
        needsPaymentAttention(j.id, invoiceByJob),
      ).length;

      const todaysSamples = samplesData.results.filter((s) =>
        isToday(s.created_at),
      ).length;

      return {
        pendingFinance: awaitingJobs.length,
        awaitingPayment,
        todaysSamples,
        unreadNotifications: unreadCount,
        openComplaints: complaintsData.count,
        activeClients: clients.length,
        pendingDiscounts: discountsData.count,
      };
    },
    staleTime: 60_000,
  });

  const loading = isLoading;

  return (
    <section aria-labelledby="receptionist-kpi-heading">
      <h3 id="receptionist-kpi-heading" className="mb-3 text-sm font-medium">
        Reception desk overview
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard
          label="Pending finance clearance"
          value={kpis?.pendingFinance ?? 0}
          href="/staff/finance"
          icon={Landmark}
          loading={loading}
          hint="Jobs awaiting invoice or payment"
        />
        <KpiCard
          label="Awaiting payment"
          value={kpis?.awaitingPayment ?? 0}
          href="/staff/finance"
          icon={ClipboardList}
          loading={loading}
          hint="Unpaid or no invoice yet"
        />
        <KpiCard
          label="Samples today"
          value={kpis?.todaysSamples ?? 0}
          href="/staff/laboratory"
          icon={TestTube}
          loading={loading}
        />
        <KpiCard
          label="Unread notifications"
          value={kpis?.unreadNotifications ?? 0}
          href="/staff/notifications"
          icon={Bell}
          loading={loading}
        />
        <KpiCard
          label="Open complaints"
          value={kpis?.openComplaints ?? 0}
          href="/staff/clients?tab=complaints"
          icon={MessageSquareWarning}
          loading={loading}
        />
        <KpiCard
          label="Active clients"
          value={kpis?.activeClients ?? 0}
          href="/staff/clients"
          icon={Users}
          loading={loading}
        />
        <KpiCard
          label="Pending discount requests"
          value={kpis?.pendingDiscounts ?? 0}
          href="/staff/finance?tab=discounts"
          icon={Percent}
          loading={loading}
        />
      </div>
    </section>
  );
}
