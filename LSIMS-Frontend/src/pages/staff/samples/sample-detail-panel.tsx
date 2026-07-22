import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchLabAnalysts } from "@/features/accounts/api";
import { createPreparationRecord } from "@/features/laboratory/api";
import {
  assignSampleAnalyst,
  assignTestToSample,
  deleteSampleHard,
  fetchTestCatalog,
  patchSample,
  removeSampleTestAssignment,
} from "@/features/laboratory/api";
import { getApiErrorMessage } from "@/lib/api";
import { shortJobId } from "@/lib/laboratory";
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

export function SampleDetailPanel({
  sample,
  manage,
  onClose,
  onUpdated,
}: {
  sample: SampleRecord;
  manage: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const displayCode = sample.sample_code ?? sample.blind_alias_code ?? "—";
  const isBlindView = !sample.sample_code && Boolean(sample.blind_alias_code);
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

  const { data: analysts = [] } = useQuery({
    queryKey: ["lab-analysts"],
    queryFn: fetchLabAnalysts,
  });

  const { data: testsPage } = useQuery({
    queryKey: ["test-catalog-sample-detail", sample.id],
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
  }, [sample]);

  const patchMut = useMutation({
    mutationFn: () => {
      const weightTrim = sampleWeight.trim();
      const body: Parameters<typeof patchSample>[1] = {
        notes,
        sample_name: sampleName.trim() || undefined,
        packaging_type: packagingType.trim(),
        collection_date: collectionDate.trim() || null,
      };
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

  const prepMut = useMutation({
    mutationFn: () => createPreparationRecord({ sample: sample.id }),
    onSuccess: () => {
      toast.success("Preparation record created.");
      void queryClient.invalidateQueries({ queryKey: ["preparation-records"] });
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
      queryClient.invalidateQueries({ queryKey: ["staff-sample", sample.id] });
      queryClient.invalidateQueries({ queryKey: ["staff-samples"] });
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const removeTestMut = useMutation({
    mutationFn: removeSampleTestAssignment,
    onSuccess: () => {
      toast.success("Assignment removed.");
      queryClient.invalidateQueries({ queryKey: ["staff-sample", sample.id] });
      queryClient.invalidateQueries({ queryKey: ["staff-samples"] });
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
          {pendingPermanentCode ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Permanent sample code pending — assigned after invoice is paid or waiver approved.
            </p>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {!isBlindView && sample.sample_name ? (
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
        {sample.received_by ? (
          <div>
            <dt className="text-xs text-muted-foreground">Received by</dt>
            <dd className="truncate">{sample.received_by}</dd>
          </div>
        ) : null}
        {sample.submitted_by ? (
          <div>
            <dt className="text-xs text-muted-foreground">Submitted by (client)</dt>
            <dd className="truncate">{sample.submitted_by}</dd>
          </div>
        ) : null}
        {sample.assigned_analyst ? (
          <div>
            <dt className="text-xs text-muted-foreground">Assigned analyst</dt>
            <dd className="truncate">{sample.assigned_analyst}</dd>
          </div>
        ) : null}
      </dl>

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

      {manage ? (
        <div className="mt-4 space-y-2 border-t pt-4">
          <Label>Preparation</Label>
          <p className="text-xs text-muted-foreground">
            Create a preparation record when the sample enters the prep bench (
            <code className="rounded bg-muted px-1">POST /preparation-records/</code>).
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={prepMut.isPending}
            onClick={() => prepMut.mutate()}
          >
            Create preparation record
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
          <p className="text-sm font-medium">Edit sample</p>
          <p className="text-xs text-muted-foreground">
            Sample workflow status follows the parent job automatically. Assign analysts via the
            dedicated action — not PATCH.
          </p>
          {!isBlindView ? (
            <div className="space-y-1">
              <Label>Sample name</Label>
              <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Analyst</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={analystId}
                onChange={(e) => setAnalystId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {analysts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Reassignment reason</Label>
            <Input
              value={reassignedReason}
              onChange={(e) => setReassignedReason(e.target.value)}
              placeholder="Recommended when changing analyst"
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Sample weight (g)</Label>
              <Input
                inputMode="decimal"
                value={sampleWeight}
                onChange={(e) => setSampleWeight(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1">
              <Label>Packaging</Label>
              <Input
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Collection date</Label>
              <Input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Assigned at</Label>
              <Input
                type="datetime-local"
                value={assignedAt}
                onChange={(e) => setAssignedAt(e.target.value)}
              />
            </div>
          </div>
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
