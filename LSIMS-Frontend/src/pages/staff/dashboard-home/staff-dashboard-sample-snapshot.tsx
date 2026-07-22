import { staffPath } from "@/lib/staff";
import { useQueries } from "@tanstack/react-query";
import { Loader2, TestTube } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchSamples } from "@/features/laboratory/api";
import { isStaffAnalyst } from "@/lib/staff";
import { useAuthStore } from "@/stores/auth-store";

import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";

const SNAPSHOT = [
  { status: "received", label: "Received" },
  { status: "in_prep", label: "In preparation" },
  { status: "in_analysis", label: "In analysis" },
  { status: "completed", label: "Completed" },
] as const;

export function StaffDashboardSampleSnapshot() {
  const user = useAuthStore((s) => s.user);
  const analyst = isStaffAnalyst(user);

  const queries = useQueries({
    queries: SNAPSHOT.map(({ status }) => ({
      queryKey: dashboardKeys.sampleCount(status),
      queryFn: () => fetchSamples({ page: 1, sample_status: status }),
      staleTime: 60_000,
    })),
  });

  const loading = queries.some((q) => q.isLoading);

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="sample-snapshot-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TestTube className="size-4 text-muted-foreground" aria-hidden />
          <div>
            <h3 id="sample-snapshot-heading" className="text-sm font-medium">
              {analyst ? "Analyst snapshot" : "Analyst area snapshot"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {analyst ? (
                <>
                  Counts for work assigned to you, grouped by{" "}
                  <code className="rounded bg-muted px-1">sample_status</code>.
                </>
              ) : (
                <>
                  Counts by <code className="rounded bg-muted px-1">sample_status</code> on your
                  account visibility.
                </>
              )}
            </p>
          </div>
        </div>
        <Link
          to={staffPath("analyst")}
          className="text-xs font-medium text-primary hover:underline"
        >
          {analyst ? "Open analyst bench →" : "Analyst workspace →"}
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SNAPSHOT.map(({ label, status }, i) => (
            <li
              key={status}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-center"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {queries[i].data?.count ?? 0}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
