import { useMutation } from "@tanstack/react-query";
import { Package, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComplaint } from "@/features/laboratory/complaints-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import type { ComplaintCategory, JobOrder } from "@/types/laboratory";

import {
  ClientRequestPriorityBadge,
  ClientRequestStatusBadge,
} from "./client-request-badges";

const COMPLAINT_CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: "payment", label: "Payment / invoice" },
  { value: "sample", label: "Sample handling" },
  { value: "result", label: "Results" },
  { value: "other", label: "Other" },
];

export function ClientJobDetailPanel({
  job,
  onClose,
}: {
  job: JobOrder;
  onClose: () => void;
}) {
  const [showComplaint, setShowComplaint] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory>("other");
  const [description, setDescription] = useState("");

  const complaintMut = useMutation({
    mutationFn: () =>
      createComplaint({
        job: job.id,
        category,
        description: description.trim(),
      }),
    onSuccess: () => {
      toast.success("Complaint submitted. Laboratory staff will review it.");
      setShowComplaint(false);
      setDescription("");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Job ID", value: <span className="font-mono text-sm">{job.id}</span> },
    {
      label: "Status",
      value: <ClientRequestStatusBadge status={job.current_status} />,
    },
    {
      label: "Priority",
      value: <ClientRequestPriorityBadge priority={job.priority} />,
    },
    {
      label: "Samples",
      value: (
        <span className="inline-flex items-center gap-1">
          <Package className="size-4 opacity-70" aria-hidden />
          {job.sample_count}
        </span>
      ),
    },
    {
      label: "Created",
      value: new Date(job.created_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
    {
      label: "Last updated",
      value: new Date(job.updated_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
    { label: "Submitted by (lab)", value: job.submitted_by },
  ];

  if (job.status_reason) {
    rows.push({
      label: "Status note",
      value: (
        <span className="whitespace-pre-wrap text-sm">{job.status_reason}</span>
      ),
    });
  }

  if (job.is_cancelled) {
    rows.push({
      label: "Cancellation",
      value: (
        <span className="text-destructive">
          {job.cancellation_reason || "Cancelled"}
        </span>
      ),
    });
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Job order
          </p>
          <p className="font-mono text-sm font-semibold">{shortJobId(job.id)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close details"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <dl className="space-y-4">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-xs text-muted-foreground">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm">
              {job.description?.trim() ? job.description : "—"}
            </dd>
          </div>
        </dl>

        {!job.is_cancelled ? (
          <div className="mt-6 space-y-3 border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Raise a complaint</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowComplaint((s) => !s)}
              >
                {showComplaint ? "Cancel" : "New complaint"}
              </Button>
            </div>
            {showComplaint ? (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (description.trim().length < 10) {
                    toast.error("Please describe the issue (at least 10 characters).");
                    return;
                  }
                  complaintMut.mutate();
                }}
              >
                <div className="space-y-1">
                  <Label>Category</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  >
                    {COMPLAINT_CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What went wrong?"
                  />
                </div>
                <Button type="submit" size="sm" disabled={complaintMut.isPending}>
                  Submit complaint
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
