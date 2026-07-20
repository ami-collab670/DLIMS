import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSample, fetchSamples } from "@/features/laboratory/staff-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import { isSampleAwaitingPayment, isSampleReadyForDeptAssignment } from "@/lib/sample-payment-gate";
import {
  staffSampleDisplayCode,
  staffSampleRowLabel,
} from "@/lib/sample-reference-display";
import { cn } from "@/lib/utils";
import { ReceptionistTestCatalogReference } from "@/pages/staff/receptionist/shared/receptionist-test-catalog-reference";
import { filterMyAssignedSamples } from "@/pages/staff/analyst/shared/analyst-bench-utils";
import { useAuthStore } from "@/stores/auth-store";

import {
  ANALYST_LIST_PAGE_SIZE,
  ANALYST_SAMPLE_STATUS_OPTIONS,
} from "./analyst-workspace-constants";
import { AnalystSampleDetailPanel } from "./analyst-sample-detail-panel";
import { RegisterSampleForm } from "./register-sample-form";

export function StaffAnalystSection({
  intake,
  canPatchSample,
  canAssignAnalyst,
  isAnalyst,
  hideClientSampleNames,
  hidePreparation = false,
  filterAwaitingPayment = false,
  filterReadyForDeptAssignment = false,
  showSampleRouting = false,
  analystBenchOnly = false,
}: {
  intake: boolean;
  canPatchSample: boolean;
  canAssignAnalyst: boolean;
  isAnalyst: boolean;
  hideClientSampleNames: boolean;
  /** Reception desk — prep start/complete is lab tech only. */
  hidePreparation?: boolean;
  /** Department manager — hide samples until Finance clears payment. */
  filterAwaitingPayment?: boolean;
  /** Department manager — hide samples without assigned tests (ready for routing). */
  filterReadyForDeptAssignment?: boolean;
  /** QC routing panel — assign analyst, create prep, optional lab tech. */
  showSampleRouting?: boolean;
  /** Analyst-only bench at /staff/analyst — assignment filter + no ops copy. */
  analystBenchOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const [page, setPage] = useState(1);
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["staff-analyst", "list", page, jobFilter, statusFilter, debounced],
    queryFn: () =>
      fetchSamples({
        page,
        job: jobFilter || undefined,
        sample_status: statusFilter || undefined,
        search: debounced || undefined,
      }),
  });

  const { data: detail } = useQuery({
    queryKey: ["staff-analyst", "detail", selectedId],
    queryFn: () => fetchSample(selectedId!),
    enabled: Boolean(selectedId),
  });

  const visibleResults = useMemo(() => {
    let rows = data?.results ?? [];
    if (filterAwaitingPayment) {
      rows = rows.filter((s) => !isSampleAwaitingPayment(s));
    }
    if (filterReadyForDeptAssignment) {
      rows = rows.filter((s) => isSampleReadyForDeptAssignment(s));
    }
    if (isAnalyst || analystBenchOnly) {
      rows = filterMyAssignedSamples(rows, userId);
    }
    return rows;
  }, [
    analystBenchOnly,
    data?.results,
    filterAwaitingPayment,
    filterReadyForDeptAssignment,
    isAnalyst,
    userId,
  ]);

  const hiddenAwaitingPaymentCount = useMemo(() => {
    if (!filterAwaitingPayment || !data?.results.length) return 0;
    return data.results.filter((s) => isSampleAwaitingPayment(s)).length;
  }, [data?.results, filterAwaitingPayment]);

  const hiddenNotReadyCount = useMemo(() => {
    if (!filterReadyForDeptAssignment || !data?.results.length) return 0;
    return data.results.filter(
      (s) =>
        !isSampleAwaitingPayment(s) && !isSampleReadyForDeptAssignment(s),
    ).length;
  }, [data?.results, filterReadyForDeptAssignment]);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.count / ANALYST_LIST_PAGE_SIZE))
    : 1;

  return (
    <div className="space-y-4">

      {hidePreparation ? null : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Preparation workflows are on the lab technician preparation bench.
        </p>
      )}

      {hidePreparation ? <ReceptionistTestCatalogReference /> : null}

      {intake ? (
        <RegisterSampleForm
          showIntakeChecklist={hidePreparation}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["staff-analyst"] });
            queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
          }}
        />
      ) : isAnalyst || analystBenchOnly ? (
        <div
          role="note"
          className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
        >
          <p className="font-medium text-foreground">Your assigned samples</p>
          <p className="mt-1">
            Only samples assigned to your analyst account appear here. Select a row to enter a
            draft result, add calibrations, and submit to department QC.
          </p>
        </div>
      ) : filterReadyForDeptAssignment ? (
        <div
          role="note"
          className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
        >
          <p className="font-medium text-foreground">Department sample routing</p>
          <p className="mt-1">
            Select a paid sample with assigned tests, assign an analyst, create a preparation
            record, and optionally pre-assign a lab technician. Lab techs see prep work on their
            bench.
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Only receptionists can register new samples.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:flex-wrap">
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label>Search</Label>
          <Input
            placeholder={
              hideClientSampleNames || isAnalyst
                ? "Blind code / technical label…"
                : "Code or name…"
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[200px] space-y-1 lg:w-72">
          <Label>Filter by job ID</Label>
          <Input
            placeholder="UUID (optional)"
            value={jobFilter}
            onChange={(e) => {
              setJobFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[200px] space-y-1 lg:w-56">
          <Label>Status</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {ANALYST_SAMPLE_STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filterAwaitingPayment || filterReadyForDeptAssignment ? (
        <p className="text-xs text-muted-foreground">
          {filterReadyForDeptAssignment
            ? "Only paid samples with assigned tests in your department are shown."
            : "Samples not yet released for laboratory work are hidden."}
          {hiddenAwaitingPaymentCount > 0
            ? ` (${hiddenAwaitingPaymentCount} awaiting payment hidden on this page)`
            : null}
          {hiddenNotReadyCount > 0
            ? ` (${hiddenNotReadyCount} without tests hidden on this page)`
            : null}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-destructive">{getApiErrorMessage(error)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">
                    {hideClientSampleNames ? "Blind label" : "Name / blind"}
                  </th>
                  {isAnalyst ? null : (
                    <>
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium">Analyst</th>
                    </>
                  )}
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleResults.map((s) => (
                  <tr
                    key={s.id}
                    className={cn(
                      "cursor-pointer border-b hover:bg-muted/40",
                      selectedId === s.id && "bg-muted/50",
                    )}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {staffSampleDisplayCode(s)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2">
                      {staffSampleRowLabel(s, hideClientSampleNames)}
                    </td>
                    {isAnalyst ? null : (
                      <>
                        <td className="px-4 py-2 font-mono text-xs">
                          {s.job ? shortJobId(s.job) : "—"}
                        </td>
                        <td className="max-w-[140px] truncate px-4 py-2 text-muted-foreground">
                          {s.assigned_analyst_email ?? s.assigned_analyst ?? (
                            filterAwaitingPayment || filterReadyForDeptAssignment ? (
                              <span className="text-amber-700 dark:text-amber-300">
                                Unassigned
                              </span>
                            ) : (
                              "—"
                            )
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2 capitalize">
                      {s.sample_status.replace(/_/g, " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data &&
        (filterAwaitingPayment || filterReadyForDeptAssignment
          ? visibleResults.length > 0
          : data.count > 0) ? (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              {(page - 1) * ANALYST_LIST_PAGE_SIZE + 1}–
              {Math.min(
                page * ANALYST_LIST_PAGE_SIZE,
                filterAwaitingPayment || filterReadyForDeptAssignment
                  ? visibleResults.length
                  : data.count,
              )}{" "}
              /{" "}
              {filterAwaitingPayment || filterReadyForDeptAssignment
                ? visibleResults.length
                : data.count}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {selectedId && detail ? (
        <AnalystSampleDetailPanel
          sample={detail}
          canPatchSample={canPatchSample}
          canAssignAnalyst={canAssignAnalyst}
          hideClientSampleNames={hideClientSampleNames}
          showResultEntry={canPatchSample || isAnalyst}
          showSampleRouting={showSampleRouting}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["staff-analyst"] });
            queryClient.invalidateQueries({
              queryKey: ["staff-analyst", "detail", selectedId],
            });
          }}
        />
      ) : null}
    </div>
  );
}
