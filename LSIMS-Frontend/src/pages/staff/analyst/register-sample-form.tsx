import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLabAnalysts } from "@/features/accounts/hooks";
import { useJobOrders } from "@/features/jobs/hooks";
import { useCreateSample } from "@/features/laboratory/hooks";
import { IntakeChecklistFields } from "@/pages/staff/receptionist/shared/intake-checklist-fields";
import { JOB_STATUS_LABEL, shortJobId } from "@/lib/laboratory";
import type { JobOrder, JobOrderStatus } from "@/types/laboratory";

/** Reception intake form for the analyst workspace / laboratory tab. */
export function RegisterSampleForm({
  onCreated,
  showIntakeChecklist = false,
  fixedJobId,
  fixedJob,
}: {
  onCreated: () => void;
  showIntakeChecklist?: boolean;
  /** When set, locks registration to this job (receptionist job detail panel). */
  fixedJobId?: string;
  /** Optional job payload when parent already loaded the job. */
  fixedJob?: JobOrder;
}) {
  const [jobId, setJobId] = useState(fixedJobId ?? "");
  const [sampleName, setSampleName] = useState("");
  const [analystId, setAnalystId] = useState("");
  const [sampleWeight, setSampleWeight] = useState("");
  const [packagingType, setPackagingType] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [clientIdVerified, setClientIdVerified] = useState(false);
  const [packagingOk, setPackagingOk] = useState(false);

  useEffect(() => {
    if (fixedJobId) setJobId(fixedJobId);
  }, [fixedJobId]);

  const { data: jobsData } = useJobOrders({ page: 1 }, { enabled: !fixedJobId });
  const { data: analysts = [] } = useLabAnalysts();

  const selectedJob = fixedJob ?? jobsData?.results.find((j) => j.id === jobId);

  const mut = useCreateSample({
    onSuccess: () => {
      toast.success("Sample registered.");
      onCreated();
      setSampleName("");
      setAnalystId("");
      setSampleWeight("");
      setPackagingType("");
      setCollectionDate("");
      setNotes("");
    },
  });

  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!jobId || !sampleName.trim() || !selectedJob) {
          toast.error("Select a job and enter a sample name.");
          return;
        }
        mut.mutate({
          job: jobId,
          sample_name: sampleName.trim(),
          submitted_by: selectedJob.client,
          assigned_analyst: analystId || undefined,
          sample_weight: sampleWeight.trim() ? sampleWeight.trim() : undefined,
          packaging_type: packagingType.trim() || undefined,
          collection_date: collectionDate.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }}
    >
      <p className="text-sm font-medium">Register sample</p>
      <p className="text-xs text-muted-foreground">
        Receptionists can create samples via{" "}
        <code className="rounded bg-muted px-1">POST /api/laboratory/samples/</code>. The API
        assigns blind and sample codes automatically.
      </p>
      <div className="space-y-1">
        <Label>Job order</Label>
        {fixedJobId ? (
          <p className="rounded-md border border-input bg-muted/30 px-3 py-2 font-mono text-sm">
            {shortJobId(fixedJobId)}
            {selectedJob ? ` — ${selectedJob.client_name || selectedJob.client}` : ""}
          </p>
        ) : (
          <select
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          >
            <option value="">Select job…</option>
            {jobsData?.results.map((j) => (
              <option key={j.id} value={j.id}>
                {shortJobId(j.id)} — {j.client}
              </option>
            ))}
          </select>
        )}
      </div>
      {selectedJob ? (
        <p className="text-xs text-muted-foreground">
          Workflow status will match this job automatically (
          <strong>{JOB_STATUS_LABEL[selectedJob.current_status as JobOrderStatus]}</strong>
          ). Advance the job in Laboratory to move every synced sample through the pipeline, or
          turn off syncing on an individual sample later.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Analyst (optional)</Label>
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
        <div className="space-y-1">
          <Label>Sample weight (g, optional)</Label>
          <Input
            inputMode="decimal"
            value={sampleWeight}
            onChange={(e) => setSampleWeight(e.target.value)}
            placeholder="e.g. 125.5"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Packaging (optional)</Label>
          <Input
            value={packagingType}
            onChange={(e) => setPackagingType(e.target.value)}
            placeholder="e.g. Sealed bag"
          />
        </div>
        <div className="space-y-1">
          <Label>Collection date (optional)</Label>
          <Input
            type="date"
            value={collectionDate}
            onChange={(e) => setCollectionDate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Sample name</Label>
        <Input
          required
          value={sampleName}
          onChange={(e) => setSampleName(e.target.value)}
          placeholder="e.g. Ore batch A — pit 3"
        />
      </div>
      <div className="space-y-1">
        <Label>Notes (optional)</Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Intake notes…"
        />
      </div>
      {selectedJob ? (
        <p className="text-xs text-muted-foreground">
          Submitted by (client): {selectedJob.client}
        </p>
      ) : null}
      {showIntakeChecklist ? (
        <IntakeChecklistFields
          clientIdVerified={clientIdVerified}
          onClientIdVerifiedChange={setClientIdVerified}
          packagingOk={packagingOk}
          onPackagingOkChange={setPackagingOk}
        />
      ) : null}
      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Register"}
      </Button>
    </form>
  );
}
