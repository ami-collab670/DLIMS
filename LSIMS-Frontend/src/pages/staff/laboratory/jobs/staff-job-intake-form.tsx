import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchLabClients } from "@/features/accounts/lab-clients-api";
import { createStaffJob } from "@/features/jobs/api";
import { IntakeChecklistFields } from "@/pages/staff/receptionist/shared/intake-checklist-fields";
import { getApiErrorMessage } from "@/lib/api-error";
import { JOB_PRIORITY_OPTIONS, shortJobId } from "@/lib/job-order-labels";
import type { JobOrder } from "@/types/laboratory";

import { StaffJobIntakeWizard } from "./staff-job-intake-wizard";

function StaffJobIntakeSimpleForm({
  onCreated,
  showIntakeChecklist = false,
}: {
  onCreated: (job: JobOrder) => void;
  showIntakeChecklist?: boolean;
}) {
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [lastCreated, setLastCreated] = useState<JobOrder | null>(null);
  const [clientIdVerified, setClientIdVerified] = useState(false);
  const [packagingOk, setPackagingOk] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["lab-clients-picker"],
    queryFn: fetchLabClients,
  });

  const mut = useMutation({
    mutationFn: createStaffJob,
    onSuccess: (job) => {
      toast.success("Job order created — send to Finance for invoicing.");
      setLastCreated(job);
      onCreated(job);
      setDescription("");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <form
      className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!clientId || description.trim().length < 3) {
          toast.error("Select a client and enter a description.");
          return;
        }
        mut.mutate({
          client: clientId,
          current_status: "pending_finance",
          priority,
          description: description.trim(),
        });
      }}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Plus className="size-4" />
        New job order (intake)
      </div>
      <p className="text-xs text-muted-foreground">
        Jobs start in <code className="rounded bg-muted px-1">pending_finance</code>. After
        creation, Finance creates an invoice and marks it paid (or approves a waiver) before
        laboratory reception proceeds.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Client</Label>
          <select
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Choose client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.email} — {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Priority</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {JOB_PRIORITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Work requested, context for analysts…"
        />
      </div>
      {showIntakeChecklist ? (
        <IntakeChecklistFields
          clientIdVerified={clientIdVerified}
          onClientIdVerifiedChange={setClientIdVerified}
          packagingOk={packagingOk}
          onPackagingOkChange={setPackagingOk}
        />
      ) : null}
      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create job"}
      </Button>
      {lastCreated ? (
        <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-sm">
          <p>
            Created {shortJobId(lastCreated.id)} — next step:{" "}
            <Link
              to={`/staff/finance?job=${lastCreated.id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              Create invoice in Finance
            </Link>
          </p>
        </div>
      ) : null}
    </form>
  );
}

export function StaffJobIntakeForm({
  onCreated,
  showIntakeChecklist = false,
  enableCatalogWizard = false,
}: {
  onCreated: (job: JobOrder) => void;
  showIntakeChecklist?: boolean;
  enableCatalogWizard?: boolean;
}) {
  if (enableCatalogWizard) {
    return (
      <StaffJobIntakeWizard onCreated={onCreated} showIntakeChecklist={showIntakeChecklist} />
    );
  }

  return (
    <StaffJobIntakeSimpleForm onCreated={onCreated} showIntakeChecklist={showIntakeChecklist} />
  );
}
