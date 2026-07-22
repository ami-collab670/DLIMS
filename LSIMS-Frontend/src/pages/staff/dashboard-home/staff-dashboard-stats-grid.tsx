import { staffPath } from "@/lib/staff";
import { BookOpen, FlaskConical, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useJobOrders } from "@/features/jobs/hooks";
import { useSamples, useTestCatalog } from "@/features/laboratory/hooks";

export function StaffDashboardStatsGrid() {
  const { data: jobsData, isLoading: jobsLoading } = useJobOrders(
    { page: 1 },
    { staleTime: 45_000 },
  );

  const { data: samplesData, isLoading: samplesLoading } = useSamples(
    { page: 1 },
    { staleTime: 60_000 },
  );

  const { data: catalogData, isLoading: catalogLoading } = useTestCatalog(
    { page: 1, is_active: true },
    { staleTime: 120_000 },
  );

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
          to={staffPath("laboratory")}
          className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary">
            <FlaskConical className="size-4" />
            Laboratory hub
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Jobs, analyst routing, and test assignments — catalog is managed separately.
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
          <p className="text-sm font-medium text-muted-foreground">Analyst-visible items</p>
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
            <Link to={staffPath("inventory")} className="text-primary hover:underline">
              Open test catalog
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
