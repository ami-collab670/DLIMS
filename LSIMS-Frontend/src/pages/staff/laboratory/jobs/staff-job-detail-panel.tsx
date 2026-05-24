import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchRoles } from "@/features/accounts/roles-api";
import { cancelJobOrder, patchJobOrder } from "@/features/jobs/api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  JOB_PRIORITY_OPTIONS,
  JOB_STATUS_OPTIONS,
  shortJobId,
} from "@/lib/job-order-labels";
import { resolveRoleLabel } from "@/lib/resolve-role-label";
import type { JobOrder } from "@/types/laboratory";

import { roleOptionLabel } from "@/pages/staff/user-management/role-display";

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
  const [status, setStatus] = useState(job.current_status);
  const [priority, setPriority] = useState(job.priority);
  const [desc, setDesc] = useState(job.description);
  const [reason, setReason] = useState(job.status_reason);
  const [blockedByRole, setBlockedByRole] = useState(job.blocked_by_role ?? "");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
    enabled: manageJobs,
    staleTime: 60_000,
  });
  const roles = rolesQuery.data ?? [];

  useEffect(() => {
    setStatus(job.current_status);
    setPriority(job.priority);
    setDesc(job.description);
    setReason(job.status_reason);
    setBlockedByRole(job.blocked_by_role ?? "");
    setShowCancelForm(false);
    setCancellationReason("");
  }, [job]);

  const patchMut = useMutation({
    mutationFn: () =>
      patchJobOrder(job.id, {
        current_status: status,
        priority,
        description: desc,
        status_reason: reason,
        blocked_by_role: blockedByRole || null,
      }),
    onSuccess: () => {
      toast.success("Job updated.");
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const cancelMut = useMutation({
    mutationFn: () =>
      cancelJobOrder(job.id, {
        cancellation_reason: cancellationReason.trim() || undefined,
      }),
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
          <dt className="text-xs text-muted-foreground">Samples</dt>
          <dd>{job.sample_count}</dd>
        </div>
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
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as JobOrder["current_status"])
              }
            >
              {JOB_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
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
            <Label>Role hold (optional)</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={blockedByRole}
              onChange={(e) => setBlockedByRole(e.target.value)}
              disabled={rolesQuery.isLoading}
            >
              <option value="">None — no role hold</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {roleOptionLabel(r)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Status note</Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
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
              <Label>Cancellation reason (optional)</Label>
              <Textarea
                rows={2}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Why is this job being cancelled?"
              />
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
                  onClick={() => {
                    setShowCancelForm(false);
                    setCancellationReason("");
                  }}
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
