import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< HEAD
import { JobRoleHoldBadge } from "@/components/jobs/job-role-hold-badge";
import { fetchRoles } from "@/features/accounts/roles-api";
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import { fetchJobOrders, patchJobOrder } from "@/features/jobs/api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_OPTIONS,
  shortJobId,
} from "@/lib/job-order-labels";
import { canManageJobsAndSamples } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";
import type { JobOrder, JobOrderStatus } from "@/types/laboratory";

import { LIMS_EXTENSION_PAGE_SIZE } from "../constants";
import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

const AWAITING_FINANCE: JobOrderStatus[] = ["pending_finance", "submitted"];

async function fetchAwaitingFinanceJobs(): Promise<{
  results: JobOrder[];
  count: number;
}> {
  const [pending, legacy] = await Promise.all([
    fetchJobOrders({
      page: 1,
      current_status: "pending_finance",
      is_cancelled: false,
    }),
    fetchJobOrders({
      page: 1,
      current_status: "submitted",
      is_cancelled: false,
    }),
  ]);
  const seen = new Set<string>();
  const results: JobOrder[] = [];
  for (const j of pending.results) {
    if (!seen.has(j.id)) {
      seen.add(j.id);
      results.push(j);
    }
  }
  for (const j of legacy.results) {
    if (!seen.has(j.id)) {
      seen.add(j.id);
      results.push(j);
    }
  }
  return { results, count: results.length };
}

/**
 * Finance: (1) Approve client requests → laboratory (`received`).
 * (2) Manage existing finance holds (`finance_hold`).
 */
export default function StaffFinancePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const manage = canManageJobsAndSamples(user);
  const [selectedHold, setSelectedHold] = useState<JobOrder | null>(null);
<<<<<<< HEAD

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
    staleTime: 60_000,
  });
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
  const [holdNextStatus, setHoldNextStatus] = useState<string>("received");
  const [holdReason, setHoldReason] = useState("");

  const { data: awaiting, isLoading: awaitingLoading, isError: awaitingError } =
    useQuery({
      queryKey: ["lims-finance-awaiting"],
      queryFn: fetchAwaitingFinanceJobs,
      staleTime: 15_000,
    });

  const {
    data: holdData,
    isLoading: holdLoading,
    isError: holdError,
  } = useQuery({
    queryKey: ["lims-finance-hold-jobs"],
    queryFn: () =>
      fetchJobOrders({
        page: 1,
        current_status: "finance_hold",
        is_cancelled: false,
      }),
    staleTime: 30_000,
  });

  const invalidateFinance = () => {
    void queryClient.invalidateQueries({ queryKey: ["lims-finance-awaiting"] });
    void queryClient.invalidateQueries({ queryKey: ["lims-finance-hold-jobs"] });
    void queryClient.invalidateQueries({ queryKey: ["client-job-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["staff-jobs-picker"] });
    void queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
    AWAITING_FINANCE.forEach((s) => {
      void queryClient.invalidateQueries({
        queryKey: ["lims-schedule-jobs", s],
      });
    });
    void queryClient.invalidateQueries({
      queryKey: ["lims-schedule-jobs", "finance_hold"],
    });
  };

  const approveMut = useMutation({
    mutationFn: (job: JobOrder) =>
      patchJobOrder(job.id, {
        current_status: "received",
        status_reason: "Finance approved — sent to laboratory intake.",
      }),
    onSuccess: () => {
      toast.success("Job approved and moved to laboratory (received).");
      invalidateFinance();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const holdFromQueueMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      patchJobOrder(id, {
        current_status: "finance_hold",
        status_reason: reason || "Placed on finance hold.",
      }),
    onSuccess: () => {
      toast.success("Job moved to finance hold.");
      setHoldDraftId(null);
      setHoldDraftReason("");
      invalidateFinance();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const [holdDraftId, setHoldDraftId] = useState<string | null>(null);
  const [holdDraftReason, setHoldDraftReason] = useState("");

  const patchHoldMut = useMutation({
    mutationFn: () =>
      patchJobOrder(selectedHold!.id, {
        current_status: holdNextStatus,
        status_reason: holdReason,
      }),
    onSuccess: () => {
      toast.success("Job updated.");
      setSelectedHold(null);
      invalidateFinance();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const awaitingRows = useMemo(() => awaiting?.results ?? [], [awaiting]);

  return (
    <div className="space-y-10">
      <LimsPageIntro title="Finance">
        <p>
          <strong>Client requests</strong> arrive as{" "}
          <code className="rounded bg-muted px-1">pending_finance</code>. Approve
          them to move the job to{" "}
          <code className="rounded bg-muted px-1">received</code> (laboratory /
          intake). Older jobs may still appear as{" "}
          <code className="rounded bg-muted px-1">submitted</code> — treat them
          the same.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      {!manage ? (
        <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
          You can view queues here. Approving or editing jobs requires an
          administrator or receptionist.
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Awaiting finance approval</h3>
        <p className="text-xs text-muted-foreground">
          Approve to send to laboratory; hold if pricing or payment must be
          cleared first.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {awaitingLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : awaitingError ? (
            <p className="p-4 text-destructive">Could not load jobs.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 font-medium">Job</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Samples</th>
                    <th className="max-w-[280px] px-4 py-3 font-medium">
                      Description (preview)
                    </th>
                    {manage ? (
                      <th className="px-4 py-3 font-medium">Actions</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {awaitingRows.map((j) => (
                    <tr key={j.id} className="border-b border-border">
                      <td className="px-4 py-3 font-mono text-xs">
<<<<<<< HEAD
                        <div className="flex flex-col gap-1">
                          {shortJobId(j.id)}
                          <JobRoleHoldBadge
                            blockedByRole={j.blocked_by_role}
                            roles={roles}
                          />
                        </div>
=======
                        {shortJobId(j.id)}
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {JOB_STATUS_LABEL[j.current_status]}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {j.client}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{j.sample_count}</td>
                      <td className="max-w-[280px] truncate px-4 py-3 text-xs text-muted-foreground">
                        {j.description?.trim() || "—"}
                      </td>
                      {manage ? (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button
                              type="button"
                              size="sm"
                              disabled={approveMut.isPending}
                              onClick={() => approveMut.mutate(j)}
                            >
                              Approve → laboratory
                            </Button>
                            {holdDraftId === j.id ? (
                              <div className="flex min-w-[200px] flex-col gap-2 rounded-md border p-2">
                                <Textarea
                                  placeholder="Reason for hold…"
                                  rows={2}
                                  className="text-xs"
                                  value={holdDraftReason}
                                  onChange={(e) =>
                                    setHoldDraftReason(e.target.value)
                                  }
                                />
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    disabled={holdFromQueueMut.isPending}
                                    onClick={() =>
                                      holdFromQueueMut.mutate({
                                        id: j.id,
                                        reason: holdDraftReason,
                                      })
                                    }
                                  >
                                    Confirm hold
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setHoldDraftId(null);
                                      setHoldDraftReason("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setHoldDraftId(j.id);
                                  setHoldDraftReason("");
                                }}
                              >
                                Place on hold
                              </Button>
                            )}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!awaitingLoading && awaitingRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No client jobs are waiting for finance approval.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Finance hold queue</h3>
        <p className="text-xs text-muted-foreground">
          Jobs already in{" "}
          <code className="rounded bg-muted px-1">finance_hold</code>. Release by
          setting the next workflow status (often back to{" "}
          <code className="rounded bg-muted px-1">received</code> or{" "}
          <code className="rounded bg-muted px-1">in_prep</code>).
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {holdLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : holdError ? (
            <p className="p-4 text-destructive">Could not load jobs.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 font-medium">Job</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Samples</th>
                    <th className="px-4 py-3 font-medium">Hold reason</th>
                    {manage ? <th className="px-4 py-3 font-medium" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {holdData?.results.map((j) => (
                    <tr key={j.id} className="border-b border-border">
                      <td className="px-4 py-3 font-mono text-xs">
<<<<<<< HEAD
                        <div className="flex flex-col gap-1">
                          {shortJobId(j.id)}
                          <JobRoleHoldBadge
                            blockedByRole={j.blocked_by_role}
                            roles={roles}
                          />
                        </div>
=======
                        {shortJobId(j.id)}
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
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
                              setSelectedHold(j);
                              setHoldNextStatus("received");
                              setHoldReason(j.status_reason ?? "");
                            }}
                          >
                            Release / edit
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {holdData && holdData.count > LIMS_EXTENSION_PAGE_SIZE ? (
            <p className="border-t px-4 py-2 text-xs text-muted-foreground">
              Showing first {LIMS_EXTENSION_PAGE_SIZE} of {holdData.count}.
            </p>
          ) : null}
          {!holdLoading && holdData?.count === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No jobs are in finance hold.
            </p>
          ) : null}
        </div>
      </section>

      {selectedHold ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-sm font-semibold">
              {shortJobId(selectedHold.id)}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedHold(null)}
            >
              Close
            </Button>
          </div>
          {!manage ? (
            <p className="text-sm text-muted-foreground">
              Read-only: only administrators and receptionists can update jobs.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Next workflow status</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={holdNextStatus}
                  onChange={(e) => setHoldNextStatus(e.target.value)}
                >
                  {JOB_STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Notes / reason</Label>
                <Textarea
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                type="button"
                disabled={patchHoldMut.isPending}
                onClick={() => patchHoldMut.mutate()}
              >
                {patchHoldMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
