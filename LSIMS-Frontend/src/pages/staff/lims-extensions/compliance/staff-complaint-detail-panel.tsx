import { Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { shortJobId } from "@/lib/job-order-labels";
import type { ComplaintRecord } from "@/types/laboratory";

import { complaintCategoryLabel } from "./constants";
import { StaffComplaintDeleteDialog } from "./staff-complaint-delete-dialog";
import { StaffComplaintEditDialog } from "./staff-complaint-edit-dialog";
import { StaffComplaintRejectDialog } from "./staff-complaint-reject-dialog";
import { StaffComplaintResolveDialog } from "./staff-complaint-resolve-dialog";
import {
  StaffComplaintCategoryBadge,
  StaffComplaintStatusBadge,
} from "./staff-complaint-badges";

type DialogMode = "edit" | "resolve" | "reject" | "delete" | null;

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type Props = {
  complaint: ComplaintRecord;
  onClose: () => void;
  onUpdated: (updated: ComplaintRecord) => void;
  onDeleted: () => void;
};

export function StaffComplaintDetailPanel({
  complaint,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [displayComplaint, setDisplayComplaint] = useState(complaint);

  useEffect(() => {
    setDisplayComplaint(complaint);
  }, [complaint]);

  const isOpen =
    displayComplaint.status === "open" || displayComplaint.status === "in_review";

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Client",
      value: displayComplaint.client_email ?? displayComplaint.client,
    },
    {
      label: "Category",
      value: <StaffComplaintCategoryBadge category={displayComplaint.category} />,
    },
    {
      label: "Status",
      value: <StaffComplaintStatusBadge status={displayComplaint.status} />,
    },
    {
      label: "Submitted",
      value: formatDateTime(displayComplaint.created_at),
    },
    {
      label: "Last updated",
      value: formatDateTime(displayComplaint.updated_at),
    },
  ];

  if (displayComplaint.job) {
    rows.splice(3, 0, {
      label: "Job",
      value: (
        <Link
          to={`/staff/laboratory?job=${displayComplaint.job}`}
          className="font-mono text-sm text-primary underline-offset-4 hover:underline"
        >
          {shortJobId(displayComplaint.job)}
        </Link>
      ),
    });
  }

  if (displayComplaint.sample) {
    rows.splice(displayComplaint.job ? 4 : 3, 0, {
      label: "Sample",
      value: <span className="font-mono text-sm">{displayComplaint.sample}</span>,
    });
  }

  if (
    displayComplaint.status === "resolved" ||
    displayComplaint.status === "rejected"
  ) {
    rows.push({
      label:
        displayComplaint.status === "rejected" ? "Rejection reason" : "Resolution",
      value: (
        <span className="whitespace-pre-wrap text-sm">
          {displayComplaint.resolution?.trim() || "—"}
        </span>
      ),
    });
    rows.push({
      label: "Closed",
      value: formatDateTime(displayComplaint.resolved_at),
    });
    if (displayComplaint.resolved_by_email) {
      rows.push({
        label: "Reviewed by",
        value: displayComplaint.resolved_by_email,
      });
    }
  }

  const handleUpdated = (updated: ComplaintRecord) => {
    setDisplayComplaint(updated);
    onUpdated(updated);
  };

  return (
    <>
      <div className="flex h-full flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Complaint
            </p>
            <p className="truncate text-sm font-semibold">
              {complaintCategoryLabel(displayComplaint.category)}
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
                {displayComplaint.description?.trim()
                  ? displayComplaint.description
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
            {isOpen ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setDialog("resolve")}
                  disabled={Boolean(dialog)}
                >
                  Resolve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setDialog("reject")}
                  disabled={Boolean(dialog)}
                >
                  Reject
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDialog("edit")}
              disabled={Boolean(dialog)}
            >
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDialog("delete")}
              disabled={Boolean(dialog)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {dialog === "edit" ? (
        <StaffComplaintEditDialog
          complaint={displayComplaint}
          onClose={() => setDialog(null)}
          onSuccess={handleUpdated}
        />
      ) : null}
      {dialog === "resolve" ? (
        <StaffComplaintResolveDialog
          complaint={displayComplaint}
          onClose={() => setDialog(null)}
          onSuccess={handleUpdated}
        />
      ) : null}
      {dialog === "reject" ? (
        <StaffComplaintRejectDialog
          complaint={displayComplaint}
          onClose={() => setDialog(null)}
          onSuccess={handleUpdated}
        />
      ) : null}
      {dialog === "delete" ? (
        <StaffComplaintDeleteDialog
          complaint={displayComplaint}
          onClose={() => setDialog(null)}
          onSuccess={onDeleted}
        />
      ) : null}
    </>
  );
}

export function StaffComplaintDetailPanelLoading({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col border-l border-border bg-card">
      <div className="flex items-center justify-end border-b border-border px-4 py-3">
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
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
