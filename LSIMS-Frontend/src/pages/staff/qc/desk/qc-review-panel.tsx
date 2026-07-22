import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveAnalysisResult,
  fetchAnalysisResult,
  rejectAnalysisResult,
} from "@/features/laboratory/api";
import { fetchCalibrationRecords } from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { fetchPreparationRecords } from "@/features/laboratory/api";
import { fetchQCDecisions } from "@/features/laboratory/api";
import { fetchSample } from "@/features/laboratory/api";
import { getApiErrorMessage } from "@/lib/api";
import { formatDecidedAt, formatSubmittedAt } from "@/lib/formatting";
import { shortJobId } from "@/lib/laboratory";
import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";
import {
  canReviewAnalysisResults,
  requireRejectReason,
} from "@/lib/laboratory/qc/desk-utils";
import { useAuthStore } from "@/stores/auth-store";
import type { AnalysisResult } from "@/types/laboratory";

type Props = {
  result: AnalysisResult;
  onClose: () => void;
  onDecided: () => void;
};

export function QcReviewPanel({ result, onClose, onDecided }: Props) {
  const user = useAuthStore((s) => s.user);
  const canReview = canReviewAnalysisResults(user);
  const queryClient = useQueryClient();
  const [qcReason, setQcReason] = useState("");

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: laboratoryQueryKeys.analysisResult(result.id),
    queryFn: () => fetchAnalysisResult(result.id),
    initialData: result,
  });

  const { data: priorDecisions = [] } = useQuery({
    queryKey: laboratoryQueryKeys.qcDecisions({ analysis_result: result.id }),
    queryFn: async () => {
      const data = await fetchQCDecisions({ analysis_result: result.id, page: 1 });
      return data.results;
    },
  });

  const { data: prepData } = useQuery({
    queryKey: laboratoryQueryKeys.preparationRecords({ sample: detail.sample }),
    queryFn: () => fetchPreparationRecords({ page: 1, sample: detail.sample }),
    enabled: Boolean(detail.sample),
  });

  const { data: calData } = useQuery({
    queryKey: laboratoryQueryKeys.calibrationRecords({ analysis_result: result.id }),
    queryFn: () => fetchCalibrationRecords({ page: 1, analysis_result: result.id }),
  });

  const { data: sampleDetail } = useQuery({
    queryKey: ["staff-sample", detail.sample],
    queryFn: () => fetchSample(detail.sample),
    enabled: Boolean(detail.sample),
  });

  const prepRecord = prepData?.results[0];
  const calibrations = calData?.results ?? [];

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["analysis-results"] });
    void queryClient.invalidateQueries({ queryKey: ["qc-decisions"] });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.qcDeskKpis });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.qcDeskInboxPreview });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.qcDeskRecentDecisions });
    void queryClient.invalidateQueries({ queryKey: ["lims-qc-jobs"] });
  };

  const approveMut = useMutation({
    mutationFn: () =>
      approveAnalysisResult(detail.id, {
        reason: qcReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Result approved.");
      setQcReason("");
      invalidateAll();
      onDecided();
      onClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      rejectAnalysisResult(detail.id, {
        reason: qcReason.trim(),
      }),
    onSuccess: () => {
      toast.success("Result rejected.");
      setQcReason("");
      invalidateAll();
      onDecided();
      onClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (detailLoading && !detail) {
    return (
      <div className="flex justify-center rounded-xl border bg-card p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">QC review</p>
          <p className="font-mono text-sm font-semibold">
            {detail.test_code} — {detail.test_name}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Sample</dt>
          <dd className="font-mono">{detail.sample_code ?? detail.sample}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Job</dt>
          <dd className="font-mono text-xs">
            {sampleDetail?.job ? shortJobId(sampleDetail.job) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Value</dt>
          <dd className="tabular-nums">
            {detail.value} {detail.unit}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Revision</dt>
          <dd>{detail.revision}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Analyst</dt>
          <dd>{detail.analyst_email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Submitted</dt>
          <dd>{formatSubmittedAt(detail.submitted_at)}</dd>
        </div>
        {detail.method?.trim() ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Method</dt>
            <dd>{detail.method}</dd>
          </div>
        ) : null}
        {detail.remarks?.trim() ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Remarks</dt>
            <dd className="whitespace-pre-wrap">{detail.remarks}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-muted-foreground">Preparation</dt>
          <dd className="capitalize">
            {prepRecord ? prepRecord.status.replace(/_/g, " ") : "No record"}
            {prepRecord?.completed_at
              ? ` · ${formatSubmittedAt(prepRecord.completed_at)}`
              : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Calibrations</dt>
          <dd>
            {calibrations.length ? (
              <ul className="mt-1 space-y-1 text-xs">
                {calibrations.map((c) => (
                  <li key={c.id}>
                    {c.instrument_name} ({c.calibration_reference || "ref"})
                  </li>
                ))}
              </ul>
            ) : (
              "None linked"
            )}
            {calibrations.length ? (
              <Link
                to={`/staff/instruments?analysis_result=${detail.id}`}
                className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
              >
                View in instruments →
              </Link>
            ) : null}
          </dd>
        </div>
      </dl>

      {priorDecisions.length ? (
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-medium">Prior QC decisions</p>
          <ul className="mt-2 space-y-2 text-xs">
            {priorDecisions.map((d) => (
              <li key={d.id} className="rounded-md border border-border px-3 py-2">
                <span className="capitalize font-medium">{d.decision}</span>
                {" · "}
                {d.decided_by_email ?? "—"}
                {" · "}
                {formatDecidedAt(d.decided_at)}
                {d.reason?.trim() ? (
                  <p className="mt-1 text-muted-foreground">{d.reason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canReview ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <div className="space-y-1">
            <Label>QC reason / notes</Label>
            <Textarea
              rows={3}
              value={qcReason}
              onChange={(e) => setQcReason(e.target.value)}
              placeholder="Required for rejection; optional for approval"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={approveMut.isPending || rejectMut.isPending}
              onClick={() => approveMut.mutate()}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                approveMut.isPending ||
                rejectMut.isPending ||
                !requireRejectReason(qcReason)
              }
              onClick={() => {
                if (!requireRejectReason(qcReason)) {
                  toast.error("A rejection reason is required.");
                  return;
                }
                rejectMut.mutate();
              }}
            >
              Reject
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
          You can view this result but cannot record QC decisions with your role.
        </p>
      )}
    </div>
  );
}
