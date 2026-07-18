import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Label } from "@/components/ui/label";
import {
  fetchJobOrder,
  fetchJobOrders,
} from "@/features/jobs/api";
import {
  DEFAULT_JOB_ORDER_SORT,
  toOrderingParam,
  toggleSortState,
  type JobOrderSortKey,
  type JobOrderSortState,
} from "@/features/jobs/job-order-list-sort";
import { SortableJobTableHead } from "@/features/jobs/sortable-job-table-head";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TablePageSize } from "@/lib/table-list-utils";
import {
  JOB_PRIORITY_OPTIONS,
  JOB_STATUS_OPTIONS,
  shortJobId,
} from "@/lib/job-order-labels";
import { cn } from "@/lib/utils";

import { LABORATORY_PAGE_SIZE } from "../constants";
import {
  LaboratoryPriorityBadge,
  LaboratoryStatusBadge,
} from "../job-badges";
import { StaffJobDetailPanel } from "./staff-job-detail-panel";
import { StaffJobIntakeForm } from "./staff-job-intake-form";

export function StaffJobsSection({
  intake,
  manageJobs,
}: {
  intake: boolean;
  manageJobs: boolean;
}) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = searchParams.get("job");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(LABORATORY_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sort, setSort] = useState<JobOrderSortState>(DEFAULT_JOB_ORDER_SORT);

  useEffect(() => setPage(1), [debouncedSearch, statusFilter, priorityFilter, sort, pageSize]);

  const listParams = useMemo(() => {
    const p: Parameters<typeof fetchJobOrders>[0] = {
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

  const { data: listData, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["staff-job-orders", listParams],
    queryFn: () => fetchJobOrders(listParams),
  });

  const {
    data: detailJob,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ["staff-job-order", selectedJobId],
    queryFn: () => fetchJobOrder(selectedJobId!),
    enabled: Boolean(selectedJobId),
  });

  const openJob = useCallback(
    (id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("job", id);
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
          <StaffJobIntakeForm
            onCreated={(job) => {
              queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
              openJob(job.id);
            }}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Only receptionists (and superusers) can register new job orders on
            behalf of clients.
          </p>
        )}

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
            <div className="py-16 text-center text-muted-foreground">
              No job orders.
            </div>
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
        <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[400px] lg:shrink-0">
          <button
            type="button"
            className="flex-1 bg-background/80 backdrop-blur-sm lg:hidden"
            aria-label="Close"
            onClick={closeJob}
          />
          <div className="w-full max-w-md overflow-y-auto border-l bg-card shadow-xl lg:max-w-none">
            {detailLoading && !displayJob ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : detailError || !displayJob ? (
              <div className="p-4 text-sm text-destructive">Could not load job.</div>
            ) : (
              <StaffJobDetailPanel
                job={displayJob}
                onClose={closeJob}
                manageJobs={manageJobs}
                onUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
                  queryClient.invalidateQueries({
                    queryKey: ["staff-job-order", displayJob.id],
                  });
                }}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}