import { clientPath } from "@/lib/routing";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Clock, Loader2, MessageSquare, Package } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { fetchJobOrders } from "@/features/jobs/api";
import { fetchComplaints } from "@/features/laboratory/api";
import { fetchNotifications } from "@/features/notifications/api";
import {
  complaintsNeedingFollowUp,
  extractClientReferenceLabel,
  formatClientDateTime,
  NOTIFICATION_KIND_LABEL,
} from "@/lib/client";
import { clientResultsJobUrl } from "@/lib/routing";
import { truncateComplaintTitle } from "@/lib/laboratory/complaints/constants";
import {
  ClientComplaintCategoryBadge,
  ClientComplaintStatusBadge,
} from "@/pages/client/complaints/client-complaint-badges";
import { ClientProgressBadge } from "@/pages/client/results/client-results-progress";

import { clientDashboardKeys } from "@/lib/client/dashboard/query-keys";

function PanelShell({
  title,
  subtitle,
  icon: Icon,
  linkTo,
  linkLabel,
  loading,
  error,
  empty,
  emptyMessage,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Clock;
  linkTo: string;
  linkLabel: string;
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <h4 className="text-sm font-medium">{title}</h4>
          </div>
          {subtitle ? (
            <p className="mt-0.5 pl-6 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <Link to={linkTo} className="shrink-0 text-xs font-medium text-primary hover:underline">
          {linkLabel}
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="py-4 text-sm text-destructive">Could not load.</p>
      ) : empty ? (
        <p className="py-4 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">{children}</ul>
      )}
    </div>
  );
}

export function ClientDashboardRecentActivity() {
  const jobsQuery = useQuery({
    queryKey: clientDashboardKeys.recentJobs,
    queryFn: () =>
      fetchJobOrders({
        page: 1,
        page_size: 5,
        is_cancelled: false,
        ordering: "-updated_at",
      }),
    staleTime: 45_000,
  });

  const notificationsQuery = useQuery({
    queryKey: clientDashboardKeys.recentNotifications,
    queryFn: () => fetchNotifications({ page: 1 }),
    staleTime: 30_000,
  });

  const unreadJobNotificationsQuery = useQuery({
    queryKey: clientDashboardKeys.unreadJobNotifications,
    queryFn: () => fetchNotifications({ page: 1, unread: "1", kind: "job" }),
    staleTime: 30_000,
  });

  const complaintsQuery = useQuery({
    queryKey: clientDashboardKeys.attentionComplaints,
    queryFn: () => fetchComplaints({ page: 1, page_size: 20 }),
    staleTime: 45_000,
  });

  const recentJobs = jobsQuery.data?.results ?? [];
  const unreadJobNotifications = unreadJobNotificationsQuery.data?.results ?? [];
  const recentNotificationsAll = notificationsQuery.data?.results ?? [];
  const displayNotifications =
    unreadJobNotifications.length > 0
      ? unreadJobNotifications.slice(0, 3)
      : recentNotificationsAll.slice(0, 3);
  const unreadJobCount = unreadJobNotificationsQuery.data?.count ?? 0;
  const followUpComplaints = complaintsNeedingFollowUp(
    complaintsQuery.data?.results ?? [],
  ).slice(0, 3);

  return (
    <section aria-labelledby="client-recent-heading">
      <h3 id="client-recent-heading" className="mb-3 text-sm font-medium">
        Recent activity
      </h3>
      <div className="grid gap-4 lg:grid-cols-3">
        <PanelShell
          title="Recent requests"
          icon={Package}
          linkTo={clientPath("results")}
          linkLabel="Track progress →"
          loading={jobsQuery.isLoading}
          error={jobsQuery.isError}
          empty={recentJobs.length === 0}
          emptyMessage="No active requests yet."
        >
          {recentJobs.map((job) => (
            <li key={job.id}>
              <Link
                to={clientResultsJobUrl(job.id)}
                className="block rounded-lg border border-border/60 px-3 py-2 transition-colors hover:bg-muted/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium">
                    {extractClientReferenceLabel(job.description)}
                  </span>
                  <ClientProgressBadge status={job.current_status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {job.sample_count} sample{job.sample_count === 1 ? "" : "s"} · Updated{" "}
                  {formatClientDateTime(job.updated_at)}
                </p>
              </Link>
            </li>
          ))}
        </PanelShell>

        <PanelShell
          title="Recent notifications"
          subtitle={
            unreadJobCount > 0
              ? `${unreadJobCount} unread job alert${unreadJobCount === 1 ? "" : "s"}`
              : undefined
          }
          icon={Clock}
          linkTo={clientPath("notifications")}
          linkLabel="View all →"
          loading={notificationsQuery.isLoading || unreadJobNotificationsQuery.isLoading}
          error={notificationsQuery.isError && unreadJobNotificationsQuery.isError}
          empty={displayNotifications.length === 0}
          emptyMessage="No notifications yet."
        >
          {displayNotifications.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-border/60 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {NOTIFICATION_KIND_LABEL[n.kind]}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </li>
          ))}
        </PanelShell>

        <PanelShell
          title="Complaints needing follow-up"
          icon={MessageSquare}
          linkTo={clientPath("complaints")}
          linkLabel="View complaints →"
          loading={complaintsQuery.isLoading}
          error={complaintsQuery.isError}
          empty={followUpComplaints.length === 0}
          emptyMessage="No open or in-review complaints."
        >
          {followUpComplaints.map((c) => (
            <li key={c.id}>
              <Link
                to={`/client/complaints?complaint=${c.id}`}
                className="block rounded-lg border border-border/60 px-3 py-2 transition-colors hover:bg-muted/30"
              >
                <p className="text-sm font-medium">
                  {truncateComplaintTitle(c.description)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <ClientComplaintCategoryBadge category={c.category} />
                  <ClientComplaintStatusBadge status={c.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatClientDateTime(c.updated_at)}
                </p>
              </Link>
            </li>
          ))}
        </PanelShell>
      </div>
    </section>
  );
}
