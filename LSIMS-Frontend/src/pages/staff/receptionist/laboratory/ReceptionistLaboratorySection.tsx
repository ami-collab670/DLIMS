import type { JobOrderListParams } from "@/features/jobs/api";
import { useJobOrder, useJobOrders } from "@/features/jobs/hooks";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_JOB_ORDER_SORT,
  toOrderingParam,
  toggleSortState,
  type JobOrderSortKey,
  type JobOrderSortState,
} from "@/lib/laboratory/jobs/sort";
import { SortableJobTableHead } from "@/features/jobs/components/sortable-job-table-head";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import type { TablePageSize } from "@/lib/table";
import {
  JOB_PRIORITY_OPTIONS,
  JOB_STATUS_OPTIONS,
  shortJobId,
} from "@/lib/laboratory";
import { cn } from "@/lib/ui";
import {
  canIntakeSamples,
  canManageJobsAndSamples,
} from "@/lib/staff";
import { useAuthStore } from "@/stores/auth-store";
import { LABORATORY_PAGE_SIZE } from "@/lib/staff/laboratory/constants";
import {
  LaboratoryPriorityBadge,
  LaboratoryStatusBadge,
} from "@/pages/staff/laboratory/job-badges";
import { StaffJobIntakeDialog } from "@/pages/staff/laboratory/jobs/staff-job-intake-dialog";

import { ReceptionistJobDetailPanel } from "./ReceptionistJobDetailPanel";

export function ReceptionistLaboratorySection() {
  const user = useAuthStore((s) => s.user);
  const intake = canIntakeSamples(user);
  const manageJobs = canManageJobsAndSamples(user);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = searchParams.get("job");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(LABORATORY_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sort, setSort] = useState<JobOrderSortState>(DEFAULT_JOB_ORDER_SORT);
  const [intakeOpen, setIntakeOpen] = useState(false);

  useEffect(() => setPage(1), [debouncedSearch, statusFilter, priorityFilter, sort, pageSize]);

  const listParams = useMemo(() => {
    const p: JobOrderListParams = {
      page,
      page_size: pageSize,
      ordering: toOrderingParam(sort),
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter) p.current_status = statusFilter;
    if (priorityFilter) p.priority = priorityFilter;
    return p;
  }, [page, pageSize, debouncedSearch, statusFilter, priorityFilter, sort]);

  const handleSort = useCallback((key: JobOrderSortKey) => {
    setSort((prev) => toggleSortState(prev, key));
  }, []);

  const { data: listData, isLoading, isError, error, isFetching } =
    useJobOrders(listParams);

  const {
    data: detailJob,
    isLoading: detailLoading,
    isError: detailError,
  } = useJobOrder(selectedJobId ?? "", {
    enabled: Boolean(selectedJobId),
  });

  const openJob = useCallback(
    (id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("job", id);
        next.delete("tab");
        return next;
      });
    },
    [setSearchParams],
  );

  const closeJob = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("job");
      return next;
    });
  }, [setSearchParams]);

  const displayJob = useMemo(() => {
    if (!selectedJobId) return null;
    if (detailJob) return detailJob;
    return listData?.results.find((j) => j.id === selectedJobId) ?? null;
  }, [selectedJobId, detailJob, listData]);

  const jobDetailSegments = useMemo(() => {
    if (!selectedJobId) return [];
    return [
      {
        label: shortJobId(displayJob?.id ?? selectedJobId),
        onClick: closeJob,
      },
    ];
  }, [closeJob, displayJob?.id, selectedJobId]);
  useBreadcrumbSegments(jobDetailSegments, "laboratory-job-detail");

  return (
    <div className="flex min-h-[min(80vh,760px)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        {intake ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-medium">Sample intake</p>
              <p className="text-xs text-muted-foreground">
                Register a client job with catalog selections and walk-in registration.
              </p>
            </div>
            <Button type="button" className="gap-1.5" onClick={() => setIntakeOpen(true)}>
              <Plus className="size-4" />
              New job order
            </Button>
            <StaffJobIntakeDialog
              open={intakeOpen}
              onOpenChange={setIntakeOpen}
              showIntakeChecklist
              onCreated={(job) => openJob(job.id)}
            />
          </div>
        ) : null}

        <TableToolbar
          searchPlaceholder="Search descriptions…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        >
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                {JOB_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All</option>
                {JOB_PRIORITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </TableToolbar>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex gap-2 p-6 text-destructive">
              <AlertCircle className="size-5" />
              {getApiErrorMessage(error)}
            </div>
          ) : !listData?.results.length ? (
            <div className="py-16 text-center text-muted-foreground">No job orders.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <SortableJobTableHead
                      label="Job"
                      sortKey="id"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableJobTableHead
                      label="Client"
                      sortKey="client__email"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableJobTableHead
                      label="Status"
                      sortKey="current_status"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableJobTableHead
                      label="Priority"
                      sortKey="priority"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableJobTableHead
                      label="Samples"
                      sortKey="sample_count"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableJobTableHead
                      label="Created"
                      sortKey="created_at"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {listData.results.map((job) => (
                    <tr
                      key={job.id}
                      className={cn(
                        "cursor-pointer border-b transition-colors hover:bg-muted/50",
                        selectedJobId === job.id && "bg-muted/60",
                      )}
                      onClick={() => openJob(job.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {shortJobId(job.id)}
                        {job.is_cancelled ? (
                          <span className="ml-2 text-destructive">Cancelled</span>
                        ) : null}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3">
                        {job.client_name || job.client}
                      </td>
                      <td className="px-4 py-3">
                        <LaboratoryStatusBadge status={job.current_status} />
                      </td>
                      <td className="px-4 py-3">
                        <LaboratoryPriorityBadge priority={job.priority} />
                      </td>
                      <td className="px-4 py-3 tabular-nums">{job.sample_count}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {listData && listData.count > 0 ? (
            <TablePaginationFooter
              page={page}
              pageSize={pageSize}
              count={listData.count}
              onPageChange={setPage}
              isFetching={isFetching && !isLoading}
            />
          ) : null}
        </div>
      </div>

      {selectedJobId ? (
        <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[420px] lg:shrink-0 lg:self-start">
          <button
            type="button"
            className="flex-1 bg-background/80 backdrop-blur-sm lg:hidden"
            aria-label="Close"
            onClick={closeJob}
          />
          <div className="w-full max-w-md overflow-y-auto border-l bg-card shadow-xl lg:max-h-[min(80vh,760px)] lg:max-w-none">
            {detailLoading && !displayJob ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : detailError || !displayJob ? (
              <div className="p-4 text-sm text-destructive">Could not load job.</div>
            ) : (
              <ReceptionistJobDetailPanel
                job={displayJob}
                onClose={closeJob}
                manageJobs={manageJobs}
                onUpdated={() => {}}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
