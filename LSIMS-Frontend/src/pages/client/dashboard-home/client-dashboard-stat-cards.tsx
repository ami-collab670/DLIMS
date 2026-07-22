import { clientPath } from "@/lib/routing";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Loader2,
  MessageSquare,
  Receipt,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { useJobOrders } from "@/features/jobs/hooks";
import { useComplaints } from "@/features/laboratory/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { formatMoney } from "@/lib/formatting";
import {
  useClientActiveJobs,
  useClientFinancialRecords,
} from "@/features/client/hooks";
import {
  countInProgressJobs,
  countInvoicesDue,
  hasRecentJobActivity,
  sumSampleCount,
  totalOutstandingAmount,
} from "@/lib/client/dashboard/metrics";

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
  const activeCountQuery = useJobOrders(
    { page: 1, page_size: 1, is_cancelled: false },
    { staleTime: 45_000 },
  );

  const allJobsQuery = useClientActiveJobs();

  const financeQuery = useClientFinancialRecords();

  const completedCountQuery = useJobOrders(
    {
      page: 1,
      page_size: 1,
      current_status: "completed",
      is_cancelled: false,
    },
    { staleTime: 45_000 },
  );

  const urgentCountQuery = useJobOrders(
    {
      page: 1,
      page_size: 1,
      priority: "urgent",
      is_cancelled: false,
    },
    { staleTime: 45_000 },
  );

  const openComplaintsQuery = useComplaints(
    { page: 1, page_size: 1, status: "open" },
    { staleTime: 45_000 },
  );

  const inReviewComplaintsQuery = useComplaints(
    { page: 1, page_size: 1, status: "in_review" },
    { staleTime: 45_000 },
  );

  const unreadQuery = useUnreadCount({ staleTime: 30_000 });

  const activeCount = activeCountQuery.data?.count ?? 0;
  const allJobs = allJobsQuery.data ?? [];
  const inProgressCount = countInProgressJobs(allJobs);
  const financeRecords = financeQuery.data ?? [];
  const invoicesDue = countInvoicesDue(financeRecords);
  const outstanding = totalOutstandingAmount(financeRecords);
  const completedCount = completedCountQuery.data?.count ?? 0;
  const urgentCount = urgentCountQuery.data?.count ?? 0;
  const totalSamples = sumSampleCount(allJobs);
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
          to={clientPath("requests")}
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
          to={clientPath("results")}
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
          to={clientPath("requests")}
          icon={Receipt}
          label="Invoices due"
          value={invoicesDue}
          loading={financeQuery.isLoading}
          context={
            outstanding > 0
              ? `${formatMoney(outstanding)} outstanding`
              : invoicesDue > 0
                ? "Payment required"
                : "No pending invoices"
          }
        />
        <StatCard
          to={clientPath("complaints")}
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
          to={clientPath("notifications")}
          icon={Bell}
          label="Unread notifications"
          value={unread}
          loading={unreadQuery.isLoading}
          context={unread > 0 ? "New alerts" : "All caught up"}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          to={clientPath("results")}
          icon={CheckCircle2}
          label="Completed"
          value={completedCount}
          loading={completedCountQuery.isLoading}
          context={
            completedCount > 0 ? "Jobs marked completed" : "No completed jobs yet"
          }
        />
        <StatCard
          to={clientPath("requests")}
          icon={Zap}
          label="Urgent requests"
          value={urgentCount}
          loading={urgentCountQuery.isLoading}
          context={
            urgentCount > 0 ? "High-priority active requests" : "No urgent requests"
          }
        />
        <StatCard
          to={clientPath("results")}
          icon={FlaskConical}
          label="Total samples"
          value={totalSamples}
          loading={allJobsQuery.isLoading}
          context={
            totalSamples > 0
              ? "Across active requests"
              : "Samples appear after intake"
          }
        />
      </div>
    </section>
  );
}
