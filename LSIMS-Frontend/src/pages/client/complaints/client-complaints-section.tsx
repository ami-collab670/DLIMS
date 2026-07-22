import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, Loader2, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { Button } from "@/components/ui/button";
import { fetchJobOrders } from "@/features/jobs/api";
import {
  fetchComplaint,
  fetchComplaints,
} from "@/features/laboratory/api";
import { fetchSamples, fetchSample } from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import { shortJobId } from "@/lib/laboratory";
import {
  sortRowsClientSide,
  toggleSortState,
  type SortState,
  type TablePageSize,
} from "@/lib/table";
import { cn } from "@/lib/ui";
import type { ComplaintCategory, ComplaintStatus, ComplaintRecord } from "@/types/laboratory";

import {
  ClientComplaintCategoryBadge,
  ClientComplaintStatusBadge,
} from "./client-complaint-badges";
import {
  complaintDescriptionPreview,
  formatJobOptionLabel,
  formatSampleDisplayName,
} from "@/lib/laboratory";
import { ClientComplaintDetailPanel } from "./client-complaint-detail-panel";
import { ClientComplaintsTableFilters } from "./client-complaints-table-filters";
import {
  CLIENT_COMPLAINTS_PAGE_SIZE,
} from "@/lib/laboratory/complaints/constants";

type ComplaintSortKey =
  | "category"
  | "description"
  | "status"
  | "job"
  | "sample"
  | "created_at";

export function ClientComplaintsSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedComplaintId = searchParams.get("complaint");
  const jobFilter = searchParams.get("job") ?? undefined;
  const sampleFilter = searchParams.get("sample") ?? undefined;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(
    CLIENT_COMPLAINTS_PAGE_SIZE,
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | "">("");
  const [sort, setSort] = useState<SortState<ComplaintSortKey>>({
    key: "created_at",
    direction: "desc",
  });

  const handleSort = useCallback((key: ComplaintSortKey) => {
    setSort((prev) => toggleSortState(prev, key));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, pageSize, jobFilter, sampleFilter]);

  const listParams = useMemo(() => {
    const p: Parameters<typeof fetchComplaints>[0] = {
      page,
      page_size: pageSize,
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter) p.status = statusFilter;
    if (categoryFilter) p.category = categoryFilter;
    if (jobFilter) p.job = jobFilter;
    if (sampleFilter) p.sample = sampleFilter;
    return p;
  }, [page, pageSize, debouncedSearch, statusFilter, categoryFilter, jobFilter, sampleFilter]);

  const jobsQuery = useQuery({
    queryKey: ["client-complaints-job-labels"],
    queryFn: () =>
      fetchJobOrders({
        page: 1,
        page_size: 50,
        is_cancelled: false,
        ordering: "-updated_at",
      }),
    staleTime: 60_000,
  });

  const jobs = jobsQuery.data?.results ?? [];

  const filteredJobSamplesQuery = useQuery({
    queryKey: ["client-complaints-filter-samples", jobFilter],
    queryFn: () => fetchSamples({ job: jobFilter!, page_size: 50 }),
    enabled: Boolean(jobFilter),
    staleTime: 45_000,
  });

  const filteredSampleQuery = useQuery({
    queryKey: ["client-complaints-filter-sample", sampleFilter],
    queryFn: () => fetchSample(sampleFilter!),
    enabled: Boolean(sampleFilter),
    staleTime: 45_000,
  });

  const jobLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const job of jobsQuery.data?.results ?? []) {
      map.set(job.id, formatJobOptionLabel(job));
    }
    return map;
  }, [jobsQuery.data]);

  const sampleNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const sample of filteredJobSamplesQuery.data?.results ?? []) {
      map.set(sample.id, formatSampleDisplayName(sample));
    }
    if (sampleFilter && filteredSampleQuery.data) {
      map.set(sampleFilter, formatSampleDisplayName(filteredSampleQuery.data));
    }
    return map;
  }, [filteredJobSamplesQuery.data, sampleFilter, filteredSampleQuery.data]);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: laboratoryQueryKeys.complaints(listParams),
    queryFn: () => fetchComplaints(listParams),
  });

  const {
    data: detailComplaint,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: laboratoryQueryKeys.complaint(selectedComplaintId!),
    queryFn: () => fetchComplaint(selectedComplaintId!),
    enabled: Boolean(selectedComplaintId),
  });

  const openComplaint = useCallback(
    (id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("complaint", id);
        return next;
      });
    },
    [setSearchParams],
  );

  const closeComplaint = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("complaint");
      return next;
    });
  }, [setSearchParams]);

  const setJobFilterParam = useCallback(
    (jobId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (jobId) {
          next.set("job", jobId);
        } else {
          next.delete("job");
          next.delete("sample");
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setSampleFilterParam = useCallback(
    (sampleId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (sampleId) {
          next.set("sample", sampleId);
        } else {
          next.delete("sample");
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const sortedComplaints = useMemo(() => {
    const rows = listData?.results ?? [];
    return sortRowsClientSide<ComplaintRecord>(rows, sort, (row, key) => {
      switch (key as ComplaintSortKey) {
        case "category":
          return row.category;
        case "description":
          return complaintDescriptionPreview(row.description);
        case "status":
          return row.status;
        case "job":
          return row.job
            ? (jobLabelById.get(row.job) ?? shortJobId(row.job))
            : "";
        case "sample":
          return row.sample
            ? (sampleNameById.get(row.sample) ?? "Linked sample")
            : "";
        case "created_at":
          return row.created_at;
        default:
          return null;
      }
    });
  }, [listData?.results, sort, jobLabelById, sampleNameById]);

  const filterSamples = filteredJobSamplesQuery.data?.results ?? [];

  const displayComplaint = useMemo(() => {
    if (!selectedComplaintId) return null;
    if (detailComplaint) return detailComplaint;
    return listData?.results.find((c) => c.id === selectedComplaintId) ?? null;
  }, [selectedComplaintId, listData, detailComplaint]);

  function renderSampleCell(complaintSample: string | null) {
    if (!complaintSample) return "—";
    if (sampleFilter && sampleNameById.has(complaintSample)) {
      return sampleNameById.get(complaintSample);
    }
    if (jobFilter && sampleNameById.has(complaintSample)) {
      return sampleNameById.get(complaintSample);
    }
    return "Linked sample";
  }

  return (
    <div className="flex min-h-[min(80vh,720px)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        {jobFilter ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Showing complaints linked to request{" "}
              <span className="font-medium text-foreground">
                {jobLabelById.get(jobFilter) ?? shortJobId(jobFilter)}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("job");
                  return next;
                });
              }}
            >
              Clear filter
            </Button>
          </div>
        ) : null}

        {sampleFilter ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Showing complaints linked to sample{" "}
              <span className="font-medium text-foreground">
                {sampleNameById.get(sampleFilter) ?? "Linked sample"}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("sample");
                  return next;
                });
              }}
            >
              Clear filter
            </Button>
          </div>
        ) : null}

        <ClientComplaintsTableFilters
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          jobFilter={jobFilter}
          onJobFilterChange={setJobFilterParam}
          sampleFilter={sampleFilter}
          onSampleFilterChange={setSampleFilterParam}
          jobs={jobs}
          filterSamples={filterSamples}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading complaints…
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
              <MessageSquare className="size-10 opacity-40" />
              <p className="font-medium text-foreground">No complaints submitted yet</p>
              <p className="max-w-sm text-sm">
                Use the form above to submit a complaint. Laboratory staff will review
                and respond here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <SortableTableHead
                      label="Category"
                      sortKey="category"
                      sort={sort}
                      onSort={handleSort}
                      className="py-3"
                    />
                    <SortableTableHead
                      label="Description"
                      sortKey="description"
                      sort={sort}
                      onSort={handleSort}
                      className="py-3"
                    />
                    <SortableTableHead
                      label="Status"
                      sortKey="status"
                      sort={sort}
                      onSort={handleSort}
                      className="py-3"
                    />
                    <SortableTableHead
                      label="Request"
                      sortKey="job"
                      sort={sort}
                      onSort={handleSort}
                      className="py-3"
                    />
                    <SortableTableHead
                      label="Sample"
                      sortKey="sample"
                      sort={sort}
                      onSort={handleSort}
                      className="py-3"
                    />
                    <SortableTableHead
                      label={
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5 opacity-70" aria-hidden />
                          Submitted
                        </span>
                      }
                      sortKey="created_at"
                      sort={sort}
                      onSort={handleSort}
                      className="py-3"
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedComplaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      className={cn(
                        "cursor-pointer border-b border-border transition-colors hover:bg-muted/50",
                        selectedComplaintId === complaint.id && "bg-muted/60",
                      )}
                      onClick={() => openComplaint(complaint.id)}
                    >
                      <td className="px-4 py-3">
                        <ClientComplaintCategoryBadge category={complaint.category} />
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                        {complaintDescriptionPreview(complaint.description) || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <ClientComplaintStatusBadge status={complaint.status} />
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3">
                        {complaint.job ? (
                          <Link
                            to={`/client/requests?job=${complaint.job}`}
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {jobLabelById.get(complaint.job) ?? shortJobId(complaint.job)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-muted-foreground">
                        {renderSampleCell(complaint.sample)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(complaint.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
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

      {selectedComplaintId ? (
        <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[380px] lg:shrink-0 lg:self-start">
          <button
            type="button"
            className="flex-1 bg-background/80 backdrop-blur-sm lg:hidden"
            aria-label="Close details"
            onClick={closeComplaint}
          />
          <div className="w-full max-w-md animate-in slide-in-from-right lg:max-w-none lg:animate-none">
            {detailLoading && !displayComplaint ? (
              <div className="flex h-full min-h-[200px] items-center justify-center border-l border-border bg-card">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : detailError ? (
              <div className="flex h-full flex-col justify-center gap-2 border-l border-border bg-card p-4 text-sm text-destructive">
                Could not load this complaint. It may have been removed or you may not
                have access.
                <Button type="button" variant="outline" size="sm" onClick={closeComplaint}>
                  Close
                </Button>
              </div>
            ) : displayComplaint ? (
              <ClientComplaintDetailPanel
                complaint={displayComplaint}
                onClose={closeComplaint}
              />
            ) : (
              <div className="flex h-full items-center justify-center border-l border-border bg-card p-4 text-sm text-muted-foreground">
                Complaint not found.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
