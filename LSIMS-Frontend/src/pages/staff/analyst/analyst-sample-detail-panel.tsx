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
  assignTestToSample,
  deleteSampleHard,
  fetchTestCatalog,
  patchSample,
  removeSampleTestAssignment,
} from "@/features/laboratory/staff-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import type { SampleRecord } from "@/types/laboratory";

import { ANALYST_SAMPLE_STATUS_OPTIONS } from "./analyst-workspace-constants";

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

  const [sampleName, setSampleName] = useState(sample.sample_name ?? "");
  const [statusSync, setStatusSync] = useState(sample.status_sync_with_job !== false);
  const [status, setStatus] = useState(sample.sample_status);
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
    queryKey: ["test-catalog-analyst-detail", sample.id],
    queryFn: () => fetchTestCatalog({ page: 1, is_active: true }),
    enabled: manage,
  });

  useEffect(() => {
    setSampleName(sample.sample_name ?? "");
    setStatusSync(sample.status_sync_with_job !== false);
    setStatus(sample.sample_status);
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
        status_sync_with_job: statusSync,
        notes,
        assigned_analyst: analystId || null,
        sample_name: sampleName.trim() || undefined,
        packaging_type: packagingType.trim(),
        collection_date: collectionDate.trim() || null,
        reassigned_reason: reassignedReason.trim(),
      };
      if (!statusSync) body.sample_status = status;
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
              Analyst view hides client identifiers; only technical fields are shown.
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
          <dt className="text-xs text-muted-foreground">Blind code</dt>
          <dd className="font-mono">{sample.blind_alias_code}</dd>
        </div>
        {sample.blind_alias_id ? (
          <div>
            <dt className="text-xs text-muted-foreground">Blind alias ID</dt>
            <dd className="font-mono text-xs">{sample.blind_alias_id}</dd>
          </div>
        ) : null}
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
      </dl>

      {!manage ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Technical details</p>
          <p className="text-xs text-muted-foreground">
            Read-only workflow and lab metadata from the API. Updating these requires reception or
            admin privileges.
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Workflow status</dt>
              <dd className="capitalize">{sample.sample_status.replace(/_/g, " ")}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Match job workflow</dt>
              <dd>
                {sample.status_sync_with_job !== false
                  ? "This sample follows the parent job's workflow stage automatically."
                  : "Manual stage: updates do not mirror the parent job unless turned back on by staff."}
              </dd>
            </div>
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
            <div className="sm:col-span-2 space-y-1">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd>
                <Textarea
                  readOnly
                  rows={3}
                  value={sample.notes ?? ""}
                  className="resize-none bg-muted/30 text-sm"
                  aria-label="Lab notes"
                />
              </dd>
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

      {manage && testsForPicker.length ? (
        <div className="mt-4 space-y-2 border-t pt-4">
          <Label>Assign catalog test</Label>
          <p className="text-xs text-muted-foreground">
            Admin and receptionist can link tests via{" "}
            <code className="rounded bg-muted px-1">POST /api/laboratory/sample-tests/</code>
            .
          </p>
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
            Updates use{" "}
            <code className="rounded bg-muted px-1">PATCH /api/laboratory/samples/:id/</code>.
            Hard delete uses <code className="rounded bg-muted px-1">DELETE</code> on the same
            URL.
          </p>
          {!isBlindView ? (
            <div className="space-y-1">
              <Label>Sample name</Label>
              <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sample-status-sync"
                className="size-4 rounded border border-input"
                checked={statusSync}
                onChange={(e) => {
                  const on = e.target.checked;
                  setStatusSync(on);
                  if (on && sample.job_status) {
                    setStatus(sample.job_status);
                  }
                }}
              />
              <Label htmlFor="sample-status-sync" className="cursor-pointer font-normal">
                Match job workflow (automatic)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {statusSync
                ? "This sample’s stage follows the parent job. Change the job’s status in Laboratory → Jobs to move it through submitted → received → preparation → analysis → QC → finance hold → completed."
                : "Manual mode: pick any stage below. Turn this back on to align this sample with the job’s current stage."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Workflow status</Label>
              <select
                disabled={statusSync}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {ANALYST_SAMPLE_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
          </div>
          <div className="space-y-1">
            <Label>Reassignment reason</Label>
            <Input
              value={reassignedReason}
              onChange={(e) => setReassignedReason(e.target.value)}
              placeholder="Required when changing analyst (recommended)"
            />
          </div>
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
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => patchMut.mutate()}
              disabled={patchMut.isPending}
            >
              Save changes
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
