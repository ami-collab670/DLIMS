import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< HEAD
import { JobRoleHoldBadge } from "@/components/jobs/job-role-hold-badge";
import { fetchRoles } from "@/features/accounts/roles-api";
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import {
  fetchJobOrders,
  patchJobOrder,
} from "@/features/jobs/api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_OPTIONS,
  shortJobId,
} from "@/lib/job-order-labels";
import { canManageJobsAndSamples } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";
import type { JobOrder } from "@/types/laboratory";

import { LIMS_EXTENSION_PAGE_SIZE } from "../constants";
import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

/**
 * Backend: `JobOrder.current_status` includes `qc`; `status_reason` documents holds.
 * PATCH `/api/laboratory/jobs/:id/` for admin/receptionist (see job detail in Laboratory).
 */
export default function StaffQcPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const manage = canManageJobsAndSamples(user);
  const [selected, setSelected] = useState<JobOrder | null>(null);
<<<<<<< HEAD

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
    staleTime: 60_000,
  });
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
  const [status, setStatus] = useState<string>("qc");
  const [reason, setReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["lims-qc-jobs"],
    queryFn: () =>
      fetchJobOrders({
        page: 1,
        current_status: "qc",
        is_cancelled: false,
      }),
    staleTime: 30_000,
  });

  const patchMut = useMutation({
    mutationFn: () =>
      patchJobOrder(selected!.id, {
        current_status: status,
        status_reason: reason,
      }),
    onSuccess: () => {
      toast.success("Job updated.");
      void queryClient.invalidateQueries({ queryKey: ["lims-qc-jobs"] });
      setSelected(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-8">
      <LimsPageIntro title="QC hub">
        <p>
          Jobs in <strong>{JOB_STATUS_LABEL.qc}</strong> appear here via{" "}
          <code className="rounded bg-muted px-1">GET /api/laboratory/jobs/?current_status=qc</code>.
          Approving or releasing a hold updates the same job endpoint used in Laboratory.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      {!manage ? (
        <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
          You can monitor the QC queue here. Changing job workflow still requires an
          administrator or receptionist in this API.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground">Loading…</div>
        ) : isError ? (
          <p className="p-4 text-destructive">Could not load jobs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Samples</th>
                  <th className="px-4 py-3 font-medium">Status note</th>
                  {manage ? <th className="px-4 py-3 font-medium" /> : null}
                </tr>
              </thead>
              <tbody>
                {data?.results.map((j) => (
                  <tr key={j.id} className="border-b border-border">
<<<<<<< HEAD
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="flex flex-col gap-1">
                        {shortJobId(j.id)}
                        <JobRoleHoldBadge
                          blockedByRole={j.blocked_by_role}
                          roles={roles}
                        />
                      </div>
                    </td>
=======
                    <td className="px-4 py-3 font-mono text-xs">{shortJobId(j.id)}</td>
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {j.client}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{j.sample_count}</td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-xs">
                      {j.status_reason || "—"}
                    </td>
                    {manage ? (
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelected(j);
                            setStatus(j.current_status);
                            setReason(j.status_reason ?? "");
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > LIMS_EXTENSION_PAGE_SIZE ? (
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            Showing first {LIMS_EXTENSION_PAGE_SIZE} of {data.count}. Use search filters in
            Laboratory for full lists.
          </p>
        ) : null}
        {!isLoading && data?.count === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No jobs are currently in QC status.
          </p>
        ) : null}
      </div>

      {selected ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-sm font-semibold">{shortJobId(selected.id)}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
          {!manage ? (
            <p className="text-sm text-muted-foreground">
              Read-only: only administrators and receptionists can PATCH job workflow.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Next workflow status</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {JOB_STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Status / hold reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Awaiting duplicate prep"
                />
              </div>
              <Button
                type="button"
                disabled={patchMut.isPending}
                onClick={() => patchMut.mutate()}
              >
                {patchMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save job update"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
