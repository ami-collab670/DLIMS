import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { fetchJobOrder } from "@/features/jobs/api";
import { fetchSample } from "@/features/laboratory/api";
import { clientJobReferenceLabel, formatSampleDisplayName, parseComplaintReference } from "@/lib/laboratory";
import type { ComplaintRecord } from "@/types/laboratory";

import {
  ClientComplaintCategoryBadge,
  ClientComplaintStatusBadge,
} from "./client-complaint-badges";
import { clientResultsJobUrl } from "@/lib/routing";
import { complaintCategoryLabel } from "@/lib/laboratory/complaints/constants";

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
  const jobQuery = useQuery({
    queryKey: ["client-complaint-detail-job", complaint.job],
    queryFn: () => fetchJobOrder(complaint.job!),
    enabled: Boolean(complaint.job),
    staleTime: 45_000,
  });

  const sampleQuery = useQuery({
    queryKey: ["client-complaint-detail-sample", complaint.sample],
    queryFn: () => fetchSample(complaint.sample!),
    enabled: Boolean(complaint.sample),
    staleTime: 45_000,
  });

  const jobLabel = complaint.job
    ? clientJobReferenceLabel(jobQuery.data?.description)
    : null;
  const sampleLabel = complaint.sample
    ? formatSampleDisplayName(sampleQuery.data)
    : null;

  const { reference, body: descriptionBody } = parseComplaintReference(
    complaint.description,
  );

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

  if (reference && !complaint.job) {
    rows.splice(2, 0, {
      label: "Reference",
      value: <span className="text-sm">{reference}</span>,
    });
  }

  if (complaint.job) {
    rows.splice(2, 0, {
      label: "Request",
      value: (
        <div className="space-y-1">
          <p className="text-sm font-medium">{jobLabel ?? "Loading request…"}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              to={`/client/requests?job=${complaint.job}`}
              className="text-primary hover:underline"
            >
              View request
            </Link>
            <Link
              to={clientResultsJobUrl(complaint.job)}
              className="text-primary hover:underline"
            >
              Track samples
            </Link>
          </div>
        </div>
      ),
    });
  }

  if (complaint.sample) {
    rows.splice(complaint.job ? 3 : 2, 0, {
      label: "Sample",
      value: (
        <div className="space-y-1">
          <p className="text-sm font-medium">{sampleLabel ?? "Loading sample…"}</p>
          {complaint.job ? (
            <Link
              to={clientResultsJobUrl(complaint.job)}
              className="text-xs text-primary hover:underline"
            >
              Open in results
            </Link>
          ) : null}
        </div>
      ),
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
              {descriptionBody.trim() || (reference ? "—" : complaint.description?.trim()) || "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
