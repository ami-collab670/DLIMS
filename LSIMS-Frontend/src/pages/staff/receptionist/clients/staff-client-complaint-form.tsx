import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComplaint } from "@/features/laboratory/complaints-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import type { AdminUserRow } from "@/types/account-admin";
import type { ComplaintCategory, JobOrder } from "@/types/laboratory";

import { COMPLAINT_CATEGORY_OPTIONS } from "@/pages/staff/lims-extensions/compliance/constants";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Props = {
  client: AdminUserRow;
  clientJobs: JobOrder[];
  onCreated?: () => void;
  onCancel: () => void;
};

export function StaffClientComplaintForm({
  client,
  clientJobs,
  onCreated,
  onCancel,
}: Props) {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState(clientJobs[0]?.id ?? "");
  const [category, setCategory] = useState<ComplaintCategory>("other");
  const [description, setDescription] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      createComplaint({
        client: client.email,
        job: jobId || null,
        description: description.trim(),
        category,
      }),
    onSuccess: () => {
      toast.success("Complaint logged.");
      void queryClient.invalidateQueries({ queryKey: laboratoryQueryKeys.complaints() });
      onCreated?.();
      onCancel();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!description.trim()) {
          toast.error("Description is required.");
          return;
        }
        createMut.mutate();
      }}
    >
      <p className="text-sm font-medium">Log complaint</p>
      <p className="text-xs text-muted-foreground">
        For {client.organization_name || client.email}
      </p>
      <div className="space-y-1">
        <Label htmlFor="staff-client-complaint-job">Related job (optional)</Label>
        <select
          id="staff-client-complaint-job"
          className={selectClassName}
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
        >
          <option value="">General — no job linked</option>
          {clientJobs.map((job) => (
            <option key={job.id} value={job.id}>
              {shortJobId(job.id)} — {job.description.slice(0, 40)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="staff-client-complaint-category">Category</Label>
        <select
          id="staff-client-complaint-category"
          className={selectClassName}
          value={category}
          onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
        >
          {COMPLAINT_CATEGORY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="staff-client-complaint-desc">Description</Label>
        <Textarea
          id="staff-client-complaint-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={createMut.isPending}>
          {createMut.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Submit complaint
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
