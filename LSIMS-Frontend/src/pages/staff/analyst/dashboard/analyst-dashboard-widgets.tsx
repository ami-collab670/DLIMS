import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FileEdit, Loader2, Send, TestTube } from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { fetchAnalysisResults } from "@/features/laboratory/analysis-results-api";
import { fetchSamples } from "@/features/laboratory/staff-api";
import { staffSampleDisplayCode } from "@/lib/sample-reference-display";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { useAuthStore } from "@/stores/auth-store";

import { ANALYST_DESK_PREVIEW_LIMIT } from "../shared/analyst-constants";
import {
  computeAnalystKpis,
  filterMyAssignedSamples,
  formatAssignedAge,
  formatSubmittedAt,
  sortAssignedSamplesOldest,
} from "../shared/analyst-bench-utils";

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

export function AnalystDashboardKpiGrid() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const { data: kpis, isLoading } = useQuery({
    queryKey: dashboardKeys.analystDeskKpis,
    queryFn: async () => {
      const [samplesRes, draftRes, submittedRes, rejectedRes] = await Promise.all([
        fetchSamples({ page: 1, page_size: 100 }),
        fetchAnalysisResults({ page: 1, page_size: 100, state: "draft" }),
        fetchAnalysisResults({ page: 1, page_size: 100, state: "submitted" }),
        fetchAnalysisResults({ page: 1, page_size: 100, state: "rejected" }),
      ]);
      const assigned = filterMyAssignedSamples(samplesRes.results, userId);
      return computeAnalystKpis(
        assigned,
        draftRes.results,
        submittedRes.results,
        rejectedRes.results,
      );
    },
    staleTime: 60_000,
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Assigned samples"
        value={kpis?.assignedSamples ?? 0}
        href="/staff/analyst"
        icon={TestTube}
        loading={isLoading}
        hint="Samples assigned to you"
      />
      <KpiCard
        label="Draft results"
        value={kpis?.draftResults ?? 0}
        href="/staff/analyst"
        icon={FileEdit}
        loading={isLoading}
        hint="Saved, not yet submitted"
      />
      <KpiCard
        label="Awaiting QC"
        value={kpis?.awaitingQc ?? 0}
        href="/staff/analyst"
        icon={Send}
        loading={isLoading}
        hint="Submitted to department manager"
      />
      <KpiCard
        label="Needs resubmit"
        value={kpis?.needsResubmit ?? 0}
        href="/staff/analyst"
        icon={AlertCircle}
        loading={isLoading}
        hint="Rejected by QC"
      />
    </div>
  );
}

export function AnalystDashboardAssignedPreview() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: dashboardKeys.analystDeskAssignedPreview,
    queryFn: async () => {
      const res = await fetchSamples({ page: 1, page_size: 100 });
      return sortAssignedSamplesOldest(filterMyAssignedSamples(res.results, userId)).slice(
        0,
        ANALYST_DESK_PREVIEW_LIMIT,
      );
    },
    staleTime: 45_000,
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Assigned to you</h3>
        <Link to="/staff/analyst" className="text-xs text-primary hover:underline">
          Open bench
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No samples assigned yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
              <span className="font-mono text-xs">{staffSampleDisplayCode(s)}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {s.sample_status.replace(/_/g, " ")} · {formatAssignedAge(s.assigned_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AnalystDashboardRecentSubmissions() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: dashboardKeys.analystDeskRecentSubmissions,
    queryFn: async () => {
      const res = await fetchAnalysisResults({
        page: 1,
        page_size: ANALYST_DESK_PREVIEW_LIMIT,
        state: "submitted",
      });
      return res.results;
    },
    staleTime: 45_000,
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Recent submissions</h3>
        <Link to="/staff/analyst" className="text-xs text-primary hover:underline">
          View bench
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
              <span>
                <span className="font-mono text-xs">{r.test_code}</span>
                <span className="text-muted-foreground"> · {r.sample_code ?? "—"}</span>
              </span>
              <span className="text-xs text-muted-foreground">{formatSubmittedAt(r.submitted_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
