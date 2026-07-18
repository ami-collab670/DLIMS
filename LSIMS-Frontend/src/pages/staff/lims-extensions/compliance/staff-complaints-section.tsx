import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, Loader2, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  fetchComplaint,
  fetchComplaints,
} from "@/features/laboratory/complaints-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import { type TablePageSize } from "@/lib/table-list-utils";
import { cn } from "@/lib/utils";
import type { ComplaintCategory, ComplaintStatus } from "@/types/laboratory";

import {
  COMPLAINT_CATEGORY_OPTIONS,
  COMPLAINT_STATUS_OPTIONS,
  STAFF_COMPLAINTS_PAGE_SIZE,
  truncateComplaintTitle,
} from "./constants";
import {
  StaffComplaintCategoryBadge,
  StaffComplaintStatusBadge,
} from "./staff-complaint-badges";
import {
  StaffComplaintDetailPanel,
  StaffComplaintDetailPanelLoading,
} from "./staff-complaint-detail-panel";

export function StaffComplaintsSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedComplaintId = searchParams.get("complaint");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(
    STAFF_COMPLAINTS_PAGE_SIZE,
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | "">(
    "",
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, pageSize]);

  const listParams = useMemo(() => {
    const p: Parameters<typeof fetchComplaints>[0] = {
      page,
      page_size: pageSize,
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter) p.status = statusFilter;
    if (categoryFilter) p.category = categoryFilter;
    return p;
  }, [page, pageSize, debouncedSearch, statusFilter, categoryFilter]);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: laboratoryQueryKeys.complaints(listParams),
    queryFn: () => fetchComplaints(listParams),
    staleTime: 30_000,
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

  const displayComplaint = useMemo(() => {
    if (!selectedComplaintId) return null;
    if (detailComplaint) return detailComplaint;
    return listData?.results.find((c) => c.id === selectedComplaintId) ?? null;
  }, [selectedComplaintId, listData, detailComplaint]);

  const complaintDetailSegments = useMemo(() => {
    if (!selectedComplaintId) return [];
    return [
      {
        label: truncateComplaintTitle(displayComplaint?.description ?? ""),
        onClick: closeComplaint,
      },
    ];
  }, [closeComplaint, displayComplaint?.description, selectedComplaintId]);

  useBreadcrumbSegments(complaintDetailSegments, "compliance-complaint-detail");

  return (
    <div className="flex min-h-[min(80vh,760px)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <TableToolbar
          searchId="staff-complaint-search"
          searchPlaceholder="Search complaints…"
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
              <Label htmlFor="filter-staff-complaint-status" className="text-xs">
                Status
              </Label>
              <select
                id="filter-staff-complaint-status"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ComplaintStatus | "")
                }
              >
                <option value="">All statuses</option>
                {COMPLAINT_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-staff-complaint-category" className="text-xs">
                Category
              </Label>
              <select
                id="filter-staff-complaint-category"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as ComplaintCategory | "")
                }
              >
                <option value="">All categories</option>
                {COMPLAINT_CATEGORY_OPTIONS.map(({ value, label }) => (
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
              <p className="font-medium text-foreground">No complaints logged</p>
              <p className="max-w-sm text-sm">
                Client-submitted complaints will appear here for review and
                resolution.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Job</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5 opacity-70" aria-hidden />
                        Submitted
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listData.results.map((complaint) => (
                    <tr
                      key={complaint.id}
                      className={cn(
                        "cursor-pointer border-b border-border transition-colors hover:bg-muted/50",
                        selectedComplaintId === complaint.id && "bg-muted/60",
                      )}
                      onClick={() => openComplaint(complaint.id)}
                    >
                      <td className="px-4 py-3">
                        <StaffComplaintCategoryBadge category={complaint.category} />
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                        {complaint.description?.trim() || "—"}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-xs">
                        {complaint.client_email ?? complaint.client}
                      </td>
                      <td className="px-4 py-3">
                        <StaffComplaintStatusBadge status={complaint.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {complaint.job ? shortJobId(complaint.job) : "—"}
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
        <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[400px] lg:shrink-0 lg:self-start">
          <button
            type="button"
            className="flex-1 bg-background/80 backdrop-blur-sm lg:hidden"
            aria-label="Close details"
            onClick={closeComplaint}
          />
          <div className="w-full max-w-md animate-in slide-in-from-right lg:max-w-none lg:animate-none">
            {detailLoading && !displayComplaint ? (
              <StaffComplaintDetailPanelLoading onClose={closeComplaint} />
            ) : detailError ? (
              <div className="flex h-full flex-col justify-center gap-2 border-l border-border bg-card p-4 text-sm text-destructive">
                Could not load this complaint. It may have been removed or you may
                not have access.
                <Button type="button" variant="outline" size="sm" onClick={closeComplaint}>
                  Close
                </Button>
              </div>
            ) : displayComplaint ? (
              <StaffComplaintDetailPanel
                key={displayComplaint.id}
                complaint={displayComplaint}
                onClose={closeComplaint}
                onUpdated={() => undefined}
                onDeleted={closeComplaint}
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
