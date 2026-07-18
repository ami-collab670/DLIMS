import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchRoles } from "@/features/accounts/roles-api";
import { cancelJobOrder, patchJobOrder } from "@/features/jobs/api";
import { fetchFinancialRecords } from "@/features/laboratory/financial-records-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  JOB_PRIORITY_OPTIONS,
  JOB_STATUS_LABEL,
  shortJobId,
} from "@/lib/job-order-labels";
import { resolveRoleLabel } from "@/lib/resolve-role-label";
import {
  mergeStaffJobDescriptionEdit,
  sanitizeJobDescriptionForStaff,
} from "@/lib/sample-reference-display";
import type { JobOrder } from "@/types/laboratory";

export function StaffJobDetailPanel({
  job,
  onClose,
  manageJobs,
  onUpdated,
}: {
  job: JobOrder;
  onClose: () => void;
  manageJobs: boolean;
  onUpdated: () => void;
}) {
  const [priority, setPriority] = useState(job.priority);
  const [desc, setDesc] = useState(() => sanitizeJobDescriptionForStaff(job.description));
  const [showCancelForm, setShowCancelForm] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
    staleTime: 60_000,
  });
  const roles = rolesQuery.data ?? [];

  const { data: financialData } = useQuery({
    queryKey: laboratoryQueryKeys.financialRecords({ job: job.id }),
    queryFn: () => fetchFinancialRecords({ job: job.id }),
    staleTime: 60_000,
  });
  const invoice = financialData?.results[0];

  useEffect(() => {
    setPriority(job.priority);
    setDesc(sanitizeJobDescriptionForStaff(job.description));
    setShowCancelForm(false);
  }, [job]);

  const patchMut = useMutation({
    mutationFn: () =>
      patchJobOrder(job.id, {
        priority,
        description: mergeStaffJobDescriptionEdit(
          job.description,
          desc === "—" ? "" : desc,
        ),
      }),
    onSuccess: () => {
      toast.success("Job updated.");
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelJobOrder(job.id),
    onSuccess: () => {
      toast.success("Job cancelled.");
      setShowCancelForm(false);
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const blockedLabel = resolveRoleLabel(job.blocked_by_role, roles);

  return (
    <div className="flex flex-col p-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Job</p>
          <p className="font-mono text-sm font-semibold">{shortJobId(job.id)}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Client</dt>
          <dd>
            {job.client_name} ({job.client})
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Workflow status</dt>
          <dd>{JOB_STATUS_LABEL[job.current_status]}</dd>
        </div>
        {job.status_reason?.trim() ? (
          <div>
            <dt className="text-xs text-muted-foreground">Status note</dt>
            <dd className="text-muted-foreground">{job.status_reason}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-muted-foreground">Samples</dt>
          <dd>{job.sample_count}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Invoice</dt>
          <dd>
            {invoice ? (
              <span className="font-mono text-xs">
                {invoice.invoice_no} · {invoice.payment_status} · paid {invoice.amount_paid} /{" "}
                {invoice.amount_expected}
                {!invoice.payment_required ? " · waived" : ""}
              </span>
            ) : (
              <span className="text-muted-foreground">No invoice yet</span>
            )}
          </dd>
        </div>
        {!job.is_cancelled ? (
          <div>
            <dt className="text-xs text-muted-foreground">Finance action</dt>
            <dd>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to={`/staff/finance?job=${job.id}`}>
                  {invoice ? "View / edit invoice" : "Create invoice"}
                </Link>
              </Button>
            </dd>
          </div>
        ) : null}
        {blockedLabel ? (
          <div>
            <dt className="text-xs text-muted-foreground">Blocked by role</dt>
            <dd>{blockedLabel}</dd>
          </div>
        ) : null}
        {job.cancellation_reason?.trim() ? (
          <div>
            <dt className="text-xs text-muted-foreground">Cancellation reason</dt>
            <dd className="text-destructive">{job.cancellation_reason}</dd>
          </div>
        ) : null}
      </dl>

      {manageJobs && !job.is_cancelled ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Workflow status, role holds, and cancellation reason are read-only on PATCH. Finance
            clears jobs via invoices; cancel uses DELETE only.
          </p>
          <div className="space-y-1">
            <Label>Priority</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as JobOrder["priority"])
              }
            >
              {JOB_PRIORITY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={desc === "—" ? "" : desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Client reference ID is hidden from staff view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => patchMut.mutate()}
              disabled={patchMut.isPending}
            >
              Save changes
            </Button>
            {!showCancelForm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowCancelForm(true)}
              >
                Cancel job
              </Button>
            ) : null}
          </div>
          {showCancelForm ? (
            <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm">
                Soft-cancel this job via DELETE? Cancellation reason cannot be sent on PATCH.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={cancelMut.isPending}
                  onClick={() => cancelMut.mutate()}
                >
                  Confirm cancel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCancelForm(false)}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {job.is_cancelled ? (
        <p className="mt-4 text-sm text-destructive">This job is cancelled.</p>
      ) : null}
    </div>
  );
}
