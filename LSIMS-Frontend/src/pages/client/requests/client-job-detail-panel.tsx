import { Package, X } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { shortJobId } from "@/lib/job-order-labels";
import type { JobOrder } from "@/types/laboratory";

import { clientComplaintsUrl } from "../complaints/client-complaint-labels";
import {
  ClientRequestPriorityBadge,
  ClientRequestStatusBadge,
} from "./client-request-badges";

export function ClientJobDetailPanel({
  job,
  onClose,
}: {
  job: JobOrder;
  onClose: () => void;
}) {
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
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <p className="text-sm font-medium">Raise a complaint</p>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={clientComplaintsUrl({ job: job.id })}>New complaint</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
