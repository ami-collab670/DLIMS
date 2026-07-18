import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { shortJobId } from "@/lib/job-order-labels";
import type { ComplaintRecord } from "@/types/laboratory";

import {
  ClientComplaintCategoryBadge,
  ClientComplaintStatusBadge,
} from "./client-complaint-badges";
import { complaintCategoryLabel } from "./constants";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ClientComplaintDetailPanel({
  complaint,
  onClose,
}: {
  complaint: ComplaintRecord;
  onClose: () => void;
}) {
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Category",
      value: <ClientComplaintCategoryBadge category={complaint.category} />,
    },
    {
      label: "Status",
      value: <ClientComplaintStatusBadge status={complaint.status} />,
    },
    {
      label: "Submitted",
      value: formatDateTime(complaint.created_at),
    },
    {
      label: "Last updated",
      value: formatDateTime(complaint.updated_at),
    },
  ];

  if (complaint.job) {
    rows.splice(2, 0, {
      label: "Job",
      value: (
        <Link
          to={`/client/requests?job=${complaint.job}`}
          className="font-mono text-sm text-primary underline-offset-4 hover:underline"
        >
          {shortJobId(complaint.job)}
        </Link>
      ),
    });
  }

  if (complaint.sample) {
    rows.splice(complaint.job ? 3 : 2, 0, {
      label: "Sample",
      value: <span className="font-mono text-sm">{complaint.sample}</span>,
    });
  }

  if (complaint.status === "resolved" || complaint.status === "rejected") {
    rows.push({
      label: complaint.status === "rejected" ? "Rejection reason" : "Resolution",
      value: (
        <span className="whitespace-pre-wrap text-sm">
          {complaint.resolution?.trim() || "—"}
        </span>
      ),
    });
    rows.push({
      label: "Closed",
      value: formatDateTime(complaint.resolved_at),
    });
    if (complaint.resolved_by_email) {
      rows.push({
        label: "Reviewed by",
        value: complaint.resolved_by_email,
      });
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Complaint
          </p>
          <p className="truncate text-sm font-semibold">
            {complaintCategoryLabel(complaint.category)}
          </p>
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
              {complaint.description?.trim() ? complaint.description : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
