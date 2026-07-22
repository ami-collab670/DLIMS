import type { JobOrderListParams } from "@/features/jobs/api";
import { useJobOrder, useJobOrders } from "@/features/jobs/hooks";
import {
  AlertCircle,
  Calendar,
  Filter,
  Loader2,
  Package,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
import {
  type TablePageSize,
} from "@/lib/table";
import {
  JOB_PRIORITY_OPTIONS,
  JOB_STATUS_OPTIONS,
  shortJobId,
} from "@/lib/laboratory";
import { cn } from "@/lib/ui";

import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/table";
import {
  ClientRequestPriorityBadge,
  ClientRequestStatusBadge,
} from "./client-request-badges";
import { ClientJobDetailPanel } from "./client-job-detail-panel";

export function ClientRequestsSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = searchParams.get("job");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(
    DEFAULT_TABLE_PAGE_SIZE,
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [cancelledFilter, setCancelledFilter] = useState<
    "all" | "active" | "cancelled"
  >("active");
  const [sort, setSort] = useState<JobOrderSortState>(DEFAULT_JOB_ORDER_SORT);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, cancelledFilter, sort, pageSize]);

  const listParams = useMemo(() => {
    const p: JobOrderListParams = {
      page,
      page_size: pageSize,
      ordering: toOrderingParam(sort),
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter) p.current_status = statusFilter;
    if (priorityFilter) p.priority = priorityFilter;
    if (cancelledFilter === "active") p.is_cancelled = false;
    if (cancelledFilter === "cancelled") p.is_cancelled = true;
    return p;
  }, [page, pageSize, debouncedSearch, statusFilter, priorityFilter, cancelledFilter, sort]);

  const handleSort = useCallback((key: JobOrderSortKey) => {
    setSort((prev) => toggleSortState(prev, key));
  }, []);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useJobOrders(listParams);

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
  }, [selectedJobId, listData, detailJob]);

  return (
    <div className="flex min-h-[min(80vh,720px)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <TableToolbar
          searchId="job-search"
          searchPlaceholder="Search by description…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        >
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">
                Status
              </Label>
              <select
                id="filter-status"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {JOB_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-priority" className="text-xs">
                Priority
              </Label>
              <select
                id="filter-priority"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All priorities</option>
                {JOB_PRIORITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-cancelled" className="text-xs">
                <span className="inline-flex items-center gap-1">
                  <Filter className="size-3.5" aria-hidden />
                  Jobs
                </span>
              </Label>
              <select
                id="filter-cancelled"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
                value={cancelledFilter}
                onChange={(e) =>
                  setCancelledFilter(e.target.value as typeof cancelledFilter)
                }
              >
                <option value="active">Active only</option>
                <option value="cancelled">Cancelled only</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </TableToolbar>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading job orders…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-destructive">
                {getApiErrorMessage(error)}
              </p>
            </div>
          ) : !listData?.results.length ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Package className="size-10 opacity-40" />
              <p className="font-medium text-foreground">No job orders yet</p>
              <p className="max-w-sm text-sm">
                When the laboratory registers a job for your account, it will
                appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <SortableJobTableHead
                      label="Job"
                      sortKey="id"
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
                      label={
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5 opacity-70" aria-hidden />
                          Created
                        </span>
                      }
                      sortKey="created_at"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableJobTableHead
                      label="Description"
                      sortKey="description"
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
                        "cursor-pointer border-b border-border transition-colors hover:bg-muted/50",
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
                      <td className="px-4 py-3">
                        <ClientRequestStatusBadge status={job.current_status} />
                      </td>
                      <td className="px-4 py-3">
                        <ClientRequestPriorityBadge priority={job.priority} />
                      </td>
                      <td className="px-4 py-3 tabular-nums">{job.sample_count}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                        {job.description?.trim() || "—"}
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
        <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[380px] lg:shrink-0 lg:self-start">
          <button
            type="button"
            className="flex-1 bg-background/80 backdrop-blur-sm lg:hidden"
            aria-label="Close details"
            onClick={closeJob}
          />
          <div className="w-full max-w-md animate-in slide-in-from-right lg:max-w-none lg:animate-none">
            {detailLoading && !displayJob ? (
              <div className="flex h-full min-h-[200px] items-center justify-center border-l border-border bg-card">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : detailError ? (
              <div className="flex h-full flex-col justify-center gap-2 border-l border-border bg-card p-4 text-sm text-destructive">
                Could not load this job. It may have been removed or you may not
                have access.
                <Button type="button" variant="outline" size="sm" onClick={closeJob}>
                  Close
                </Button>
              </div>
            ) : displayJob ? (
              <ClientJobDetailPanel job={displayJob} onClose={closeJob} />
            ) : (
              <div className="flex h-full items-center justify-center border-l border-border bg-card p-4 text-sm text-muted-foreground">
                Job not found.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
