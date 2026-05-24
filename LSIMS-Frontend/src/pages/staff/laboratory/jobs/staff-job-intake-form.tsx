import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchLabClients } from "@/features/accounts/lab-clients-api";
import { createStaffJob } from "@/features/jobs/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { JOB_PRIORITY_OPTIONS } from "@/lib/job-order-labels";
import type { JobOrder } from "@/types/laboratory";

export function StaffJobIntakeForm({
  onCreated,
}: {
  onCreated: (job: JobOrder) => void;
}) {
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");

  const { data: clients = [] } = useQuery({
    queryKey: ["lab-clients-picker"],
    queryFn: fetchLabClients,
  });

  const mut = useMutation({
    mutationFn: createStaffJob,
    onSuccess: (job) => {
      toast.success("Job order created.");
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
        if (!clientEmail || description.trim().length < 3) {
          toast.error("Select a client and enter a description.");
          return;
        }
        mut.mutate({
          client: clientEmail,
          current_status: "received",
          priority,
          description: description.trim(),
        });
      }}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Plus className="size-4" />
        New job order (intake)
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Client</Label>
          <select
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          >
            <option value="">Choose client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.email}>
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
      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create job"}
      </Button>
    </form>
  );
}
