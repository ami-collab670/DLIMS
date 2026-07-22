import { ROUTES } from "@/lib/routing";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, Loader2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { fetchJobOrders } from "@/features/jobs/api";
import { fetchAnalysisResults } from "@/features/laboratory/api";
import { fetchQCDecisions } from "@/features/laboratory/api";
import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";
import { formatSubmittedAt } from "@/lib/formatting";
import {
  computeQcKpis,
  sortSubmittedResults,
} from "@/lib/laboratory/qc/desk-utils";
import { QC_PREVIEW_LIMIT } from "@/lib/staff/qc/constants";

function KpiCard({
  label,
  value,
  href,
  icon: Icon,
  loading,
  hint,
}: {
  label: string;
  value: number | string;
  href: string;
  icon: LucideIcon;
  loading?: boolean;
  hint?: string;
}) {
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

export function QcDashboardKpiGrid() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: dashboardKeys.qcDeskKpis,
    queryFn: async () => {
      const [submittedRes, decisionsRes, qcJobs] = await Promise.all([
        fetchAnalysisResults({ page: 1, page_size: 100, state: "submitted" }),
        fetchQCDecisions({ page: 1, page_size: 200 }),
        fetchJobOrders({ page: 1, current_status: "qc", is_cancelled: false }),
      ]);
      return computeQcKpis(
        submittedRes.results,
        submittedRes.count,
        decisionsRes.results,
        qcJobs.count,
      );
    },
    staleTime: 60_000,
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        label="Awaiting review"
        value={kpis?.awaitingReview ?? 0}
        href={ROUTES.staff.qc.root}
        icon={BadgeCheck}
        loading={isLoading}
        hint="Submitted results in your department"
      />
      <KpiCard
        label="Approved today"
        value={kpis?.approvedToday ?? 0}
        href={ROUTES.staff.qc.history}
        icon={BadgeCheck}
        loading={isLoading}
      />
      <KpiCard
        label="Rejected today"
        value={kpis?.rejectedToday ?? 0}
        href={ROUTES.staff.qc.rejected}
        icon={XCircle}
        loading={isLoading}
      />
      <KpiCard
        label="Avg queue time"
        value={
          kpis?.averageQueueHours != null ? `${kpis.averageQueueHours} h` : "—"
        }
        href={ROUTES.staff.qc.root}
        icon={Clock}
        loading={isLoading}
      />
      <KpiCard
        label="Jobs in QC"
        value={kpis?.jobsInQc ?? 0}
        href={`${ROUTES.staff.qc.root}#jobs`}
        icon={Clock}
        loading={isLoading}
      />
    </div>
  );
}

export function QcDashboardInboxPreview() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: dashboardKeys.qcDeskInboxPreview,
    queryFn: async () => {
      const res = await fetchAnalysisResults({
        page: 1,
        page_size: 100,
        state: "submitted",
      });
      return sortSubmittedResults(res.results, "oldest").slice(0, QC_PREVIEW_LIMIT);
    },
    staleTime: 30_000,
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Inbox preview</h3>
        <Link
          to={ROUTES.staff.qc.root}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Open review desk →
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : isError ? (
        <p className="py-4 text-sm text-destructive">Could not load inbox.</p>
      ) : data.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No submitted results pending review.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium tabular-nums">{r.value}</span>
                {r.unit ? (
                  <span className="text-muted-foreground"> {r.unit}</span>
                ) : null}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {r.test_code} · {r.sample_code ?? r.sample} ·{" "}
                {formatSubmittedAt(r.submitted_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function QcDashboardRecentDecisions() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: dashboardKeys.qcDeskRecentDecisions,
    queryFn: async () => {
      const res = await fetchQCDecisions({ page: 1, page_size: QC_PREVIEW_LIMIT });
      return res.results;
    },
    staleTime: 30_000,
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Recent decisions</h3>
        <Link
          to={ROUTES.staff.qc.history}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Full history →
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : isError ? (
        <p className="py-4 text-sm text-destructive">Could not load decisions.</p>
      ) : data.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No QC decisions recorded yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className="capitalize font-medium">{d.decision}</span>
              {" · "}
              <span className="text-xs text-muted-foreground">
                {d.decided_by_email ?? "—"} · {new Date(d.decided_at).toLocaleString()}
              </span>
              {d.reason?.trim() ? (
                <p className="mt-1 truncate text-xs text-muted-foreground">{d.reason}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
