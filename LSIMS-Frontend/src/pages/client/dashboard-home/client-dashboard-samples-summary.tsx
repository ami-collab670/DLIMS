import { clientPath } from "@/lib/routing";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import {
  fetchAllActiveJobs,
  fetchRecentSamples,
} from "@/features/client/lib/dashboard-queries";
import { formatClientDateTime, sumSampleCount } from "@/lib/client";
import { clientResultsJobUrl } from "@/lib/routing";
import { ClientProgressBadge } from "@/pages/client/results/client-results-progress";

import { clientDashboardKeys } from "@/lib/client/dashboard/query-keys";

export function ClientDashboardSamplesSummary() {
  const jobsQuery = useQuery({
    queryKey: clientDashboardKeys.allActiveJobs,
    queryFn: fetchAllActiveJobs,
    staleTime: 45_000,
  });

  const samplesQuery = useQuery({
    queryKey: clientDashboardKeys.recentSamples,
    queryFn: () => fetchRecentSamples(5),
    staleTime: 45_000,
  });

  const loading = jobsQuery.isLoading || samplesQuery.isLoading;
  const allJobs = jobsQuery.data ?? [];
  const totalSamples = sumSampleCount(allJobs);
  const recentSamples = samplesQuery.data ?? [];

  return (
    <section aria-labelledby="client-samples-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id="client-samples-heading" className="text-sm font-medium">
          Sample overview
        </h3>
        <Link
          to={clientPath("results")}
          className="text-xs font-medium text-primary hover:underline"
        >
          Track all samples →
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <FlaskConical className="size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-2xl font-semibold tabular-nums">{totalSamples}</p>
                <p className="text-xs text-muted-foreground">
                  Total samples across active requests
                </p>
              </div>
            </div>

            {recentSamples.length === 0 ? (
              <p className="pt-4 text-sm text-muted-foreground">
                No samples registered yet. Submit a request with sample details to begin
                tracking.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentSamples.map((sample) => {
                  const displayName = sample.sample_name?.trim() || "Unnamed sample";
                  const jobId = sample.job;

                  return (
                    <li
                      key={sample.id}
                      className="rounded-lg border border-border/60 px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          {jobId ? (
                            <Link
                              to={clientResultsJobUrl(jobId)}
                              className="truncate text-sm font-medium text-primary hover:underline"
                            >
                              {displayName}
                            </Link>
                          ) : (
                            <span className="truncate text-sm font-medium">
                              {displayName}
                            </span>
                          )}
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Updated {formatClientDateTime(sample.updated_at)}
                          </p>
                        </div>
                        <ClientProgressBadge status={sample.sample_status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
