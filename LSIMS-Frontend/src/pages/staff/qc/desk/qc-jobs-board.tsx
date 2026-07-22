import { ROUTES } from "@/lib/routing";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { JobRoleHoldBadge } from "@/components/jobs/job-role-hold-badge";
import { useRoles } from "@/features/accounts/hooks";
import { useJobOrders } from "@/features/jobs/hooks";
import { useQCDecisions } from "@/features/laboratory/hooks";
import { getApiErrorMessage } from "@/lib/api";
import { JOB_STATUS_LABEL, shortJobId } from "@/lib/laboratory";
import { shouldHideClientSampleNames } from "@/lib/laboratory";
import { isQcManager } from "@/lib/staff";
import { useAuthStore } from "@/stores/auth-store";

export function QcJobsBoard() {
  const user = useAuthStore((s) => s.user);
  const hideClient = shouldHideClientSampleNames(user) || isQcManager(user);

  const { data: roles = [] } = useRoles(undefined, { staleTime: 60_000 });

  const { data, isLoading, isError, error } = useJobOrders(
    {
      page: 1,
      page_size: 50,
      current_status: "qc",
      is_cancelled: false,
    },
    { staleTime: 30_000 },
  );

  return (
    <section id="jobs" className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Jobs in QC status (read-only)</h3>
        <p className="text-xs text-muted-foreground">
          Monitor jobs currently in{" "}
          <code className="rounded bg-muted px-1">{JOB_STATUS_LABEL.qc}</code>. Workflow moves
          forward when all required results are QC-approved.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">{getApiErrorMessage(error)}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 font-medium">Job</th>
                  {!hideClient ? (
                    <th className="px-4 py-3 font-medium">Client</th>
                  ) : null}
                  <th className="px-4 py-3 font-medium">Samples</th>
                  <th className="px-4 py-3 font-medium">Status note</th>
                </tr>
              </thead>
              <tbody>
                {data?.results.map((j) => (
                  <tr key={j.id} className="border-b border-border">
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="flex flex-col gap-1">
                        {shortJobId(j.id)}
                        <JobRoleHoldBadge blockedByRole={j.blocked_by_role} roles={roles} />
                      </div>
                    </td>
                    {!hideClient ? (
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                        {j.client}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 tabular-nums">{j.sample_count}</td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-xs">
                      {j.status_reason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && data?.count === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No jobs are currently in QC status.</p>
        ) : null}
      </div>
    </section>
  );
}

export function QcRecentDecisionsStrip() {
  const { data, isLoading } = useQCDecisions(
    { page: 1, page_size: 5 },
    { staleTime: 30_000 },
  );

  const rows = data?.results ?? [];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Recent QC decisions</h3>
        <Link
          to={ROUTES.staff.qc.history}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Full history →
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No QC decisions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Decision</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                  <th className="px-4 py-2 font-medium">By</th>
                  <th className="px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="px-4 py-2 capitalize">{d.decision}</td>
                    <td className="px-4 py-2 font-mono text-xs">{d.analysis_result}</td>
                    <td className="px-4 py-2 text-xs">{d.decided_by_email ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(d.decided_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
