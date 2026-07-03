import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JobRoleHoldBadge } from "@/components/jobs/job-role-hold-badge";
import { fetchRoles } from "@/features/accounts/roles-api";
import {
  approveAnalysisResult,
  fetchAnalysisResults,
  rejectAnalysisResult,
} from "@/features/laboratory/analysis-results-api";
import { fetchQCDecisions } from "@/features/laboratory/qc-decisions-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { fetchJobOrders } from "@/features/jobs/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { JOB_STATUS_LABEL, shortJobId } from "@/lib/job-order-labels";
import type { AnalysisResult } from "@/types/laboratory";

import { LIMS_EXTENSION_PAGE_SIZE } from "../constants";
import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

export default function StaffQcPage() {
  const queryClient = useQueryClient();
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [qcReason, setQcReason] = useState("");

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
    staleTime: 60_000,
  });

  const { data: jobData, isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ["lims-qc-jobs"],
    queryFn: () =>
      fetchJobOrders({
        page: 1,
        current_status: "qc",
        is_cancelled: false,
      }),
    staleTime: 30_000,
  });

  const { data: submittedResults, isLoading: resultsLoading } = useQuery({
    queryKey: laboratoryQueryKeys.analysisResults({ state: "submitted" }),
    queryFn: () => fetchAnalysisResults({ page: 1, state: "submitted" }),
    staleTime: 20_000,
  });

  const { data: qcHistory } = useQuery({
    queryKey: laboratoryQueryKeys.qcDecisions(),
    queryFn: () => fetchQCDecisions({ page: 1 }),
    staleTime: 30_000,
  });

  const invalidateQc = () => {
    void queryClient.invalidateQueries({ queryKey: ["lims-qc-jobs"] });
    void queryClient.invalidateQueries({ queryKey: ["analysis-results"] });
    void queryClient.invalidateQueries({ queryKey: ["qc-decisions"] });
    void queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
  };

  const approveMut = useMutation({
    mutationFn: () =>
      approveAnalysisResult(selectedResult!.id, {
        reason: qcReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Result approved.");
      setSelectedResult(null);
      setQcReason("");
      invalidateQc();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      rejectAnalysisResult(selectedResult!.id, {
        reason: qcReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Result rejected.");
      setSelectedResult(null);
      setQcReason("");
      invalidateQc();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const submittedRows = submittedResults?.results ?? [];
  const historyRows = qcHistory?.results ?? [];

  return (
    <div className="space-y-8">
      <LimsPageIntro title="QC hub">
        <p>
          Review submitted analysis results and record QC decisions. Job workflow advances when
          results are approved — do not PATCH job status from this page.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Submitted results (awaiting QC)</h3>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {resultsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2 font-medium">Test</th>
                    <th className="px-4 py-2 font-medium">Sample</th>
                    <th className="px-4 py-2 font-medium">Value</th>
                    <th className="px-4 py-2 font-medium">Analyst</th>
                    <th className="px-4 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {submittedRows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">
                        {r.test_code} — {r.test_name}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {r.sample_code ?? r.sample}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {r.value} {r.unit}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {r.analyst_email ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedResult(r);
                            setQcReason("");
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!resultsLoading && submittedRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No results awaiting QC review.
            </p>
          ) : null}
        </div>
      </section>

      {selectedResult ? (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedResult.test_code} — {selectedResult.value} {selectedResult.unit}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedResult(null)}
            >
              Close
            </Button>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>QC reason / notes</Label>
              <Textarea
                rows={3}
                value={qcReason}
                onChange={(e) => setQcReason(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={approveMut.isPending}
                onClick={() => approveMut.mutate()}
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={rejectMut.isPending}
                onClick={() => rejectMut.mutate()}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">QC decision history</h3>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Decision</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                  <th className="px-4 py-2 font-medium">By</th>
                  <th className="px-4 py-2 font-medium">Reason</th>
                  <th className="px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.slice(0, LIMS_EXTENSION_PAGE_SIZE).map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="px-4 py-2 capitalize">{d.decision}</td>
                    <td className="px-4 py-2 font-mono text-xs">{d.analysis_result}</td>
                    <td className="px-4 py-2 text-xs">{d.decided_by_email ?? "—"}</td>
                    <td className="max-w-[200px] truncate px-4 py-2 text-xs">
                      {d.reason || "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(d.decided_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {historyRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No QC decisions recorded yet.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Jobs in QC status (read-only)</h3>
        <p className="text-xs text-muted-foreground">
          Monitor jobs currently in{" "}
          <code className="rounded bg-muted px-1">{JOB_STATUS_LABEL.qc}</code>. Workflow moves
          forward when all required results are QC-approved.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {jobsLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">Loading…</div>
          ) : jobsError ? (
            <p className="p-4 text-destructive">Could not load jobs.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 font-medium">Job</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Samples</th>
                    <th className="px-4 py-3 font-medium">Status note</th>
                  </tr>
                </thead>
                <tbody>
                  {jobData?.results.map((j) => (
                    <tr key={j.id} className="border-b border-border">
                      <td className="px-4 py-3 font-mono text-xs">
                        <div className="flex flex-col gap-1">
                          {shortJobId(j.id)}
                          <JobRoleHoldBadge blockedByRole={j.blocked_by_role} roles={roles} />
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                        {j.client}
                      </td>
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
          {!jobsLoading && jobData?.count === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No jobs are currently in QC status.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
