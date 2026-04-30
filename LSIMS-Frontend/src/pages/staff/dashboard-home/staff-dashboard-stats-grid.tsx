import { useQuery } from "@tanstack/react-query";
import { BookOpen, FlaskConical, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchJobOrders } from "@/features/jobs/api";
import { fetchSamples, fetchTestCatalog } from "@/features/laboratory/staff-api";

import { dashboardKeys } from "./dashboard-api-keys";

export function StaffDashboardStatsGrid() {
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: dashboardKeys.recentJobs,
    queryFn: () => fetchJobOrders({ page: 1 }),
    staleTime: 45_000,
  });

  const { data: samplesData, isLoading: samplesLoading } = useQuery({
    queryKey: ["staff-dashboard", "samples", "total-count"],
    queryFn: () => fetchSamples({ page: 1 }),
    staleTime: 60_000,
  });

  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: dashboardKeys.catalogActive,
    queryFn: () => fetchTestCatalog({ page: 1, is_active: true }),
    staleTime: 120_000,
  });

  const jobsCount = jobsData?.count ?? "—";
  const samplesCount = samplesData?.count ?? "—";
  const catalogCount = catalogData?.count ?? "—";
  const loading = jobsLoading || samplesLoading || catalogLoading;

  return (
    <section aria-labelledby="totals-heading">
      <h3 id="totals-heading" className="mb-3 text-sm font-medium">
        Registry totals
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/staff/laboratory"
          className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary">
            <FlaskConical className="size-4" />
            Laboratory hub
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Full workflows for jobs, catalog, and test assignments.
          </p>
        </Link>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Job orders</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tabular-nums">
            {jobsLoading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              jobsCount
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            All records visible to your role (paginated API total)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Samples</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tabular-nums">
            {samplesLoading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              samplesCount
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registered counts (analysts: assigned only)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="size-4" />
            Active tests in catalog
          </div>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tabular-nums">
            {catalogLoading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              catalogCount
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link to="/staff/laboratory" className="text-primary hover:underline">
              Manage in Laboratory → Catalog
            </Link>
          </p>
        </div>
      </div>
      {loading ? null : (
        <p className="mt-3 text-xs text-muted-foreground">
          Figures come directly from the laboratory API totals on the first page request (
          <code className="rounded bg-muted px-0.5">count</code> field).
        </p>
      )}
    </section>
  );
}
