import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Package,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJobOrder, fetchJobOrders } from "@/features/jobs/api";
import {
  JOB_PRIORITY_OPTIONS,
  JOB_STATUS_OPTIONS,
  shortJobId,
} from "@/lib/job-order-labels";
import { cn } from "@/lib/utils";

import {
  ClientRequestPriorityBadge,
  ClientRequestStatusBadge,
} from "./client-request-badges";
import { CLIENT_REQUESTS_PAGE_SIZE } from "./constants";
import { ClientJobDetailPanel } from "./client-job-detail-panel";

export function ClientRequestsSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = searchParams.get("job");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [cancelledFilter, setCancelledFilter] = useState<
    "all" | "active" | "cancelled"
  >("active");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, cancelledFilter]);

  const listParams = useMemo(() => {
    const p: Parameters<typeof fetchJobOrders>[0] = { page };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter) p.current_status = statusFilter;
    if (priorityFilter) p.priority = priorityFilter;
    if (cancelledFilter === "active") p.is_cancelled = false;
    if (cancelledFilter === "cancelled") p.is_cancelled = true;
    return p;
  }, [page, debouncedSearch, statusFilter, priorityFilter, cancelledFilter]);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["client-job-orders", listParams],
    queryFn: () => fetchJobOrders(listParams),
  });

  const {
    data: detailJob,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ["job-order", selectedJobId],
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

  const totalPages = listData
    ? Math.max(1, Math.ceil(listData.count / CLIENT_REQUESTS_PAGE_SIZE))
    : 1;

  const displayJob = useMemo(() => {
    if (!selectedJobId) return null;
    if (detailJob) return detailJob;
    return listData?.results.find((j) => j.id === selectedJobId) ?? null;
  }, [selectedJobId, listData, detailJob]);

  return (
    <div className="flex min-h-[min(80vh,720px)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative min-w-0 flex-1">
              <Label htmlFor="job-search" className="sr-only">
                Search
              </Label>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="job-search"
                className="pl-9"
                placeholder="Search by description…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
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
          </div>
        </div>

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
                {(error as Error)?.message ?? "Could not load job orders."}
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
                    <th className="px-4 py-3 font-medium">Job</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Samples</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5 opacity-70" aria-hidden />
                        Created
                      </span>
                    </th>
                    <th className="px-4 py-3 font-medium">Description</th>
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
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                {isFetching && !isLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Updating…
                  </span>
                ) : (
                  <>
                    Showing {(page - 1) * CLIENT_REQUESTS_PAGE_SIZE + 1}–
                    {Math.min(page * CLIENT_REQUESTS_PAGE_SIZE, listData.count)} of{" "}
                    {listData.count}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
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
