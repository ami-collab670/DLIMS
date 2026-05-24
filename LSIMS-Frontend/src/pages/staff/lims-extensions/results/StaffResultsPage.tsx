import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchSamples } from "@/features/laboratory/staff-api";
import { shortJobId } from "@/lib/job-order-labels";
import { canManageJobsAndSamples } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import { LIMS_EXTENSION_PAGE_SIZE } from "../constants";
import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

const PIPELINE_STATUSES = [
  { key: "in_prep", label: "In preparation" },
  { key: "in_analysis", label: "In analysis" },
  { key: "qc", label: "Quality control" },
  { key: "completed", label: "Completed" },
] as const;

/**
 * Backend: no analytical result values — only samples, statuses, and assigned tests
 * (`sample_tests` on `GET /api/laboratory/samples/`).
 */
export default function StaffResultsPage() {
  const user = useAuthStore((s) => s.user);
  const canPatchSamples = canManageJobsAndSamples(user);

  const queries = useQueries({
    queries: PIPELINE_STATUSES.map(({ key }) => ({
      queryKey: ["lims-results-samples", key],
      queryFn: () =>
        fetchSamples({ page: 1, sample_status: key }),
      staleTime: 45_000,
    })),
  });

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Results &amp; analysis tracking">
        <p>
          The API exposes sample workflow status and which catalog tests are assigned (
          <code className="rounded bg-muted px-1">sample_tests</code>
          ). Numeric results, LOD/LOR, and flags are not in the current backend — use this
          view to coordinate work and see test coverage per sample.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">From the backend today:</strong> list/filter
        samples by <code className="rounded bg-muted px-1">sample_status</code>, read{" "}
        <code className="rounded bg-muted px-1">sample_tests</code> (test code &amp; name).
        {canPatchSamples ? (
          <>
            {" "}
            Updating status uses{" "}
            <code className="rounded bg-muted px-1">PATCH …/samples/:id/</code> from the{" "}
            <Link to="/staff/analyst" className="text-primary underline-offset-4 hover:underline">
              Analyst
            </Link>{" "}
            workspace.
          </>
        ) : (
          <>
            {" "}
            Your role can use the{" "}
            <Link to="/staff/analyst" className="text-primary underline-offset-4 hover:underline">
              Analyst
            </Link>{" "}
            workspace for allowed views; sample PATCH is limited to administrators and
            receptionists in this deployment.
          </>
        )}
      </div>

      <div className="space-y-6">
        {PIPELINE_STATUSES.map(({ key, label }, i) => {
          const q = queries[i];
          const data = q.data;
          return (
            <section
              key={key}
              className="rounded-xl border border-border bg-card shadow-sm"
              aria-labelledby={`results-${key}`}
            >
              <div className="border-b border-border px-4 py-3">
                <h3 id={`results-${key}`} className="text-sm font-medium">
                  {label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {data ? `${data.count} sample(s)` : "…"}
                </p>
              </div>
              {q.isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading…</p>
              ) : q.isError ? (
                <p className="p-4 text-sm text-destructive">Could not load samples.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-2 font-medium">Sample</th>
                        <th className="px-4 py-2 font-medium">Job</th>
                        <th className="px-4 py-2 font-medium">Tests assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.results.slice(0, LIMS_EXTENSION_PAGE_SIZE).map((s) => (
                        <tr key={s.id} className="border-b border-border">
                          <td className="px-4 py-2 font-mono text-xs">
                            {s.sample_code ?? s.blind_alias_code}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {s.job ? shortJobId(s.job) : "—"}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {s.sample_tests.length
                              ? s.sample_tests.map((t) => t.test_code).join(", ")
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
