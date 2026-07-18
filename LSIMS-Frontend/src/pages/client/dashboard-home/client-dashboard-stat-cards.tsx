import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ClipboardList,
  Loader2,
  MessageSquare,
  Receipt,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchJobOrders } from "@/features/jobs/api";
import { fetchComplaints } from "@/features/laboratory/complaints-api";
import { fetchFinancialRecords } from "@/features/laboratory/financial-records-api";
import { fetchUnreadNotificationCount } from "@/features/notifications/api";
import {
  countInProgressJobs,
  countInvoicesDue,
  fetchAllActiveJobs,
  hasRecentJobActivity,
  totalOutstandingAmount,
} from "@/pages/client/dashboard-home/client-dashboard-metrics";

import { clientDashboardKeys } from "./client-dashboard-api-keys";

const cardClass =
  "group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40";

function StatCard({
  to,
  icon: Icon,
  label,
  value,
  context,
  loading,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  context?: string;
  loading?: boolean;
}) {
  return (
    <Link to={to} className={cardClass}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary">
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </div>
      <p className="mt-3 flex items-center gap-2 text-2xl font-semibold tabular-nums">
        {loading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          value
        )}
      </p>
      {context ? (
        <p className="mt-1 text-xs text-muted-foreground">{context}</p>
      ) : null}
    </Link>
  );
}

export function ClientDashboardStatCards() {
  const activeCountQuery = useQuery({
    queryKey: clientDashboardKeys.activeJobCount,
    queryFn: () => fetchJobOrders({ page: 1, page_size: 1, is_cancelled: false }),
    staleTime: 45_000,
  });

  const allJobsQuery = useQuery({
    queryKey: clientDashboardKeys.allActiveJobs,
    queryFn: fetchAllActiveJobs,
    staleTime: 45_000,
  });

  const financeQuery = useQuery({
    queryKey: clientDashboardKeys.financialRecords,
    queryFn: () => fetchFinancialRecords({ page: 1 }),
    staleTime: 45_000,
  });

  const openComplaintsQuery = useQuery({
    queryKey: clientDashboardKeys.openComplaints,
    queryFn: () => fetchComplaints({ page: 1, page_size: 1, status: "open" }),
    staleTime: 45_000,
  });

  const inReviewComplaintsQuery = useQuery({
    queryKey: clientDashboardKeys.inReviewComplaints,
    queryFn: () => fetchComplaints({ page: 1, page_size: 1, status: "in_review" }),
    staleTime: 45_000,
  });

  const unreadQuery = useQuery({
    queryKey: clientDashboardKeys.unreadCount,
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30_000,
  });

  const activeCount = activeCountQuery.data?.count ?? 0;
  const allJobs = allJobsQuery.data ?? [];
  const inProgressCount = countInProgressJobs(allJobs);
  const financeRecords = financeQuery.data?.results ?? [];
  const invoicesDue = countInvoicesDue(financeRecords);
  const outstanding = totalOutstandingAmount(financeRecords);
  const openComplaints = openComplaintsQuery.data?.count ?? 0;
  const inReviewComplaints = inReviewComplaintsQuery.data?.count ?? 0;
  const unread = unreadQuery.data ?? 0;

  const recentActivity = hasRecentJobActivity(allJobs);

  return (
    <section aria-labelledby="client-stats-heading">
      <h3 id="client-stats-heading" className="mb-3 text-sm font-medium">
        Overview
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          to="/client/requests"
          icon={ClipboardList}
          label="Active requests"
          value={activeCount}
          loading={activeCountQuery.isLoading}
          context={
            recentActivity
              ? "Updated in the last 7 days"
              : activeCount > 0
                ? "View all requests"
                : "Submit your first request"
          }
        />
        <StatCard
          to="/client/results"
          icon={TrendingUp}
          label="In progress"
          value={inProgressCount}
          loading={allJobsQuery.isLoading}
          context={
            inProgressCount > 0
              ? `${inProgressCount} in lab workflow`
              : "Track sample progress"
          }
        />
        <StatCard
          to="/client/requests"
          icon={Receipt}
          label="Invoices due"
          value={invoicesDue}
          loading={financeQuery.isLoading}
          context={
            outstanding > 0
              ? `${outstanding.toFixed(2)} ETB outstanding`
              : invoicesDue > 0
                ? "Payment required"
                : "No pending invoices"
          }
        />
        <StatCard
          to="/client/complaints"
          icon={MessageSquare}
          label="Open complaints"
          value={openComplaints}
          loading={openComplaintsQuery.isLoading}
          context={
            inReviewComplaints > 0
              ? `${inReviewComplaints} in review`
              : openComplaints > 0
                ? "Awaiting staff response"
                : "No open complaints"
          }
        />
        <StatCard
          to="/client/notifications"
          icon={Bell}
          label="Unread notifications"
          value={unread}
          loading={unreadQuery.isLoading}
          context={unread > 0 ? "New alerts" : "All caught up"}
        />
      </div>
    </section>
  );
}
