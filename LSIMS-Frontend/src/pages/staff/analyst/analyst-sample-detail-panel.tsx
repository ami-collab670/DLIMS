import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchLabAnalysts } from "@/features/accounts/lab-analysts-api";
import {
  createAnalysisResult,
  submitAnalysisResult,
} from "@/features/laboratory/analysis-results-api";
import {
  assignSampleAnalyst,
  assignTestToSample,
  deleteSampleHard,
  fetchTestCatalog,
  patchSample,
  removeSampleTestAssignment,
} from "@/features/laboratory/staff-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import { staffSampleDisplayCode } from "@/lib/sample-reference-display";
import type { SampleRecord } from "@/types/laboratory";

function formatDateForInput(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "";
  return isoOrDate.length >= 10 ? isoOrDate.slice(0, 10) : isoOrDate;
}

function formatDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplayDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "—";
  const d =
    isoOrDate.length >= 10 && !isoOrDate.includes("T")
      ? new Date(`${isoOrDate.slice(0, 10)}T12:00:00`)
      : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString();
}

function formatDisplayDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function AnalystSampleDetailPanel({
  sample,
  manage,
  hideClientSampleNames,
  onClose,
  onUpdated,
}: {
  sample: SampleRecord;
  manage: boolean;
  hideClientSampleNames: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const displayCode = staffSampleDisplayCode(sample);
  const isBlindView =
    hideClientSampleNames || (!sample.sample_code && Boolean(sample.blind_alias_code));
  const pendingPermanentCode = !sample.sample_code;

  const [sampleName, setSampleName] = useState(sample.sample_name ?? "");
  const [notes, setNotes] = useState(sample.notes);
  const [analystId, setAnalystId] = useState(sample.assigned_analyst ?? "");
  const [sampleWeight, setSampleWeight] = useState(
    sample.sample_weight != null ? String(sample.sample_weight) : "",
  );
  const [packagingType, setPackagingType] = useState(sample.packaging_type ?? "");
  const [collectionDate, setCollectionDate] = useState(
    formatDateForInput(sample.collection_date),
  );
  const [assignedAt, setAssignedAt] = useState(
    formatDateTimeLocal(sample.assigned_at),
  );
  const [reassignedReason, setReassignedReason] = useState(sample.reassigned_reason ?? "");
  const [testToAdd, setTestToAdd] = useState("");
  const [resultSampleTest, setResultSampleTest] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [resultUnit, setResultUnit] = useState("");

  const { data: analysts = [] } = useQuery({
    queryKey: ["lab-analysts"],
    queryFn: fetchLabAnalysts,
    enabled: manage,
  });

  const { data: testsPage } = useQuery({
    queryKey: ["test-catalog-analyst-detail", sample.id],
    queryFn: () => fetchTestCatalog({ page: 1, is_active: true }),
    enabled: manage,
  });

  useEffect(() => {
    setSampleName(sample.sample_name ?? "");
    setNotes(sample.notes);
    setAnalystId(sample.assigned_analyst ?? "");
    setSampleWeight(sample.sample_weight != null ? String(sample.sample_weight) : "");
    setPackagingType(sample.packaging_type ?? "");
    setCollectionDate(formatDateForInput(sample.collection_date));
    setAssignedAt(formatDateTimeLocal(sample.assigned_at));
    setReassignedReason(sample.reassigned_reason ?? "");
    setTestToAdd("");
    setResultSampleTest(sample.sample_tests[0]?.id ?? "");
    setResultValue("");
    setResultUnit("");
  }, [sample]);

  const patchMut = useMutation({
    mutationFn: () => {
      const weightTrim = sampleWeight.trim();
      const body: Parameters<typeof patchSample>[1] = {
        notes,
        packaging_type: packagingType.trim(),
        collection_date: collectionDate.trim() || null,
      };
      if (!hideClientSampleNames) {
        body.sample_name = sampleName.trim() || undefined;
      }
      if (weightTrim) body.sample_weight = weightTrim;
      else body.sample_weight = null;
      if (assignedAt.trim()) {
        const dt = new Date(assignedAt);
        body.assigned_at = Number.isNaN(dt.getTime()) ? null : dt.toISOString();
      } else {
        body.assigned_at = null;
      }
      return patchSample(sample.id, body);
    },
    onSuccess: () => {
      toast.success("Sample updated.");
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const assignAnalystMut = useMutation({
    mutationFn: () =>
      assignSampleAnalyst(sample.id, {
        assigned_analyst: analystId,
        reassigned_reason: reassignedReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Analyst assigned.");
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const createResultMut = useMutation({
    mutationFn: async () => {
      const created = await createAnalysisResult({
        sample_test: resultSampleTest,
        value: resultValue.trim(),
        unit: resultUnit.trim() || undefined,
      });
      return submitAnalysisResult(created.id);
    },
    onSuccess: () => {
      toast.success("Result submitted for QC.");
      setResultValue("");
      setResultUnit("");
      void queryClient.invalidateQueries({ queryKey: ["analysis-results"] });
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const delMut = useMutation({
    mutationFn: () => deleteSampleHard(sample.id),
    onSuccess: () => {
      toast.success("Sample deleted.");
      onUpdated();
      onClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const assignMut = useMutation({
    mutationFn: () => assignTestToSample({ sample: sample.id, test: testToAdd }),
    onSuccess: () => {
      toast.success("Test assigned.");
      setTestToAdd("");
      queryClient.invalidateQueries({
        queryKey: ["staff-analyst", "detail", sample.id],
      });
      queryClient.invalidateQueries({ queryKey: ["staff-analyst"] });
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const removeTestMut = useMutation({
    mutationFn: removeSampleTestAssignment,
    onSuccess: () => {
      toast.success("Assignment removed.");
      queryClient.invalidateQueries({
        queryKey: ["staff-analyst", "detail", sample.id],
      });
      queryClient.invalidateQueries({ queryKey: ["staff-analyst"] });
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const assignedTestIds = new Set(sample.sample_tests.map((t) => t.test));
  const testsForPicker =
    testsPage?.results.filter((t) => !assignedTestIds.has(t.id)) ?? [];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">
            {isBlindView ? "Blind sample" : "Sample"}
          </p>
          <p className="font-mono font-semibold">{displayCode}</p>
          {isBlindView ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Analyst view hides client identifiers; workflow status follows the parent job.
            </p>
          ) : null}
          {pendingPermanentCode ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Permanent sample code pending payment or waiver.
            </p>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {!isBlindView && !hideClientSampleNames && sample.sample_name ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Name</dt>
            <dd>{sample.sample_name}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-muted-foreground">Workflow status</dt>
          <dd className="capitalize">{sample.sample_status.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Blind code</dt>
          <dd className="font-mono">{sample.blind_alias_code ?? "—"}</dd>
        </div>
        {sample.job ? (
          <div>
            <dt className="text-xs text-muted-foreground">Job</dt>
            <dd className="font-mono text-xs">{shortJobId(sample.job)}</dd>
          </div>
        ) : null}
        {sample.job_status ? (
          <div>
            <dt className="text-xs text-muted-foreground">Job status</dt>
            <dd className="capitalize">{sample.job_status.replace(/_/g, " ")}</dd>
          </div>
        ) : null}
      </dl>

      {!manage ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Technical details</p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Sample weight (g)</dt>
              <dd>{sample.sample_weight != null && sample.sample_weight !== "" ? sample.sample_weight : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Packaging</dt>
              <dd>{sample.packaging_type?.trim() ? sample.packaging_type : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Collection date</dt>
              <dd>{formatDisplayDate(sample.collection_date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Assigned at</dt>
              <dd>{formatDisplayDateTime(sample.assigned_at)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="mt-3 text-sm">
        <span className="text-muted-foreground">Assigned tests: </span>
        {sample.sample_tests.length ? (
          <ul className="mt-1 list-inside list-disc text-sm">
            {sample.sample_tests.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">
                  {t.test_code} — {t.test_name}
                </span>
                {manage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive"
                    disabled={removeTestMut.isPending}
                    onClick={() => {
                      if (confirm(`Remove ${t.test_code} from this sample?`)) {
                        removeTestMut.mutate(t.id);
                      }
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          "—"
        )}
      </div>

      {sample.sample_tests.length ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Enter analysis result</p>
          <p className="text-xs text-muted-foreground">
            Creates a draft result and submits it for QC in one step.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Sample-test assignment</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={resultSampleTest}
                onChange={(e) => setResultSampleTest(e.target.value)}
              >
                {sample.sample_tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.test_code} — {t.test_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Value</Label>
              <Input
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Input value={resultUnit} onChange={(e) => setResultUnit(e.target.value)} />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={
              !resultSampleTest || !resultValue.trim() || createResultMut.isPending
            }
            onClick={() => createResultMut.mutate()}
          >
            Submit for QC
          </Button>
        </div>
      ) : null}

      {manage && testsForPicker.length ? (
        <div className="mt-4 space-y-2 border-t pt-4">
          <Label>Assign catalog test</Label>
          <div className="flex flex-wrap gap-2">
            <select
              className="flex min-w-[200px] flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={testToAdd}
              onChange={(e) => setTestToAdd(e.target.value)}
            >
              <option value="">Select test…</option>
              {testsForPicker.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.test_code} — {t.test_name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={!testToAdd || assignMut.isPending}
              onClick={() => assignMut.mutate()}
            >
              Assign test
            </Button>
          </div>
        </div>
      ) : null}

      {manage ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Edit sample (reception/admin)</p>
          {!isBlindView && !hideClientSampleNames ? (
            <div className="space-y-1">
              <Label>Sample name</Label>
              <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
            </div>
          ) : null}
          <div className="space-y-1">
            <Label>Analyst</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={analystId}
              onChange={(e) => setAnalystId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {analysts.map((a) => (
                <option key={a.id} value={a.email}>
                  {a.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Reassignment reason</Label>
            <Input
              value={reassignedReason}
              onChange={(e) => setReassignedReason(e.target.value)}
            />
          </div>
          {analystId ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={assignAnalystMut.isPending}
              onClick={() => assignAnalystMut.mutate()}
            >
              Assign analyst
            </Button>
          ) : null}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => patchMut.mutate()} disabled={patchMut.isPending}>
              Save metadata
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={delMut.isPending}
              onClick={() => {
                if (confirm("Permanently delete this sample?")) delMut.mutate();
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
