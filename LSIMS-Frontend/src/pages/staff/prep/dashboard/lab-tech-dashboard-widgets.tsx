import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { fetchPreparationRecords } from "@/features/laboratory/preparation-records-api";
import { staffPreparationSampleCode } from "@/lib/sample-reference-display";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { useAuthStore } from "@/stores/auth-store";

import { LAB_TECH_DESK_PREVIEW_LIMIT } from "../shared/lab-tech-constants";
import {
  computeLabTechKpis,
  filterMyPrepRecords,
  sortPrepQueueOldest,
} from "../shared/lab-tech-utils";

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

export function LabTechDashboardKpiGrid() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const { data: kpis, isLoading } = useQuery({
    queryKey: dashboardKeys.labTechDeskKpis,
    queryFn: async () => {
      const res = await fetchPreparationRecords({ page: 1, page_size: 200 });
      return computeLabTechKpis(res.results, userId);
    },
    staleTime: 60_000,
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label="Pending (claimable)"
        value={kpis?.pendingClaimable ?? 0}
        href="/staff/prep"
        icon={PlayCircle}
        loading={isLoading}
        hint="Assigned to you or unassigned pending"
      />
      <KpiCard
        label="In progress"
        value={kpis?.inProgressMine ?? 0}
        href="/staff/prep"
        icon={Clock}
        loading={isLoading}
        hint="Preparation you started"
      />
      <KpiCard
        label="Completed today"
        value={kpis?.completedToday ?? 0}
        href="/staff/prep"
        icon={CheckCircle2}
        loading={isLoading}
        hint="Finished prep today"
      />
    </div>
  );
}

export function LabTechDashboardQueuePreview() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: dashboardKeys.labTechDeskQueuePreview,
    queryFn: async () => {
      const res = await fetchPreparationRecords({ page: 1, page_size: 200 });
      const visible = filterMyPrepRecords(res.results, userId).filter(
        (r) => r.status === "pending" || r.status === "in_progress",
      );
      return sortPrepQueueOldest(visible).slice(0, LAB_TECH_DESK_PREVIEW_LIMIT);
    },
    staleTime: 45_000,
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Prep queue</h3>
        <Link to="/staff/prep" className="text-xs text-primary hover:underline">
          Open bench
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No preparation work in your queue.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
              <span className="font-mono text-xs">{staffPreparationSampleCode(r)}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {r.status.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
