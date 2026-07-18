import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { fetchJobOrder, fetchJobOrders } from "@/features/jobs/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { TablePageSize } from "@/lib/table-list-utils";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/table-list-utils";
import type { JobOrder } from "@/types/laboratory";

import { ClientResultsJobDetailPanel } from "./client-results-job-panel";
import {
  ClientProgressBadge,
  formatClientDate,
} from "./client-results-progress";

function ClientResultsJobRow({
  job,
  selected,
  onSelect,
}: {
  job: JobOrder;
  selected: boolean;
  onSelect: () => void;
}) {
  const description = job.description?.trim() || "Untitled request";

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/30",
        selected && "bg-muted/50",
      )}
      onClick={onSelect}
      aria-selected={selected}
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{description}</span>
      <ClientProgressBadge
        status={job.current_status}
        className="shrink-0"
      />
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatClientDate(job.created_at)}
      </span>
    </button>
  );
}

export default function ClientResultsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(DEFAULT_TABLE_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const openJob = useCallback((id: string) => {
    setSelectedJobId(id);
  }, []);

  const closeJob = useCallback(() => {
    setSelectedJobId(null);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-results-jobs", page, pageSize, debouncedSearch],
    queryFn: () =>
      fetchJobOrders({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        is_cancelled: false,
        ordering: "-created_at",
      }),
    staleTime: 45_000,
  });

  const {
    data: detailJob,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ["client-results-job", selectedJobId],
    queryFn: () => fetchJobOrder(selectedJobId!),
    enabled: Boolean(selectedJobId),
    staleTime: 45_000,
  });

  const displayJob = useMemo(() => {
    if (!selectedJobId) return null;
    if (detailJob) return detailJob;
    return data?.results.find((j) => j.id === selectedJobId) ?? null;
  }, [selectedJobId, detailJob, data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My results</h2>
        <p className="text-sm text-muted-foreground">
          Approved analytical values (test results) are not yet available on client accounts.
          This view shows sample intake and test progress only.
        </p>
      </div>

      <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
        Track new requests under{" "}
        <Link to="/client/requests" className="text-primary underline-offset-4 hover:underline">
          My requests
        </Link>
        . Select a job to view details.
      </div>

      <div className="flex min-h-[min(80vh,720px)] flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <TableToolbar
            searchPlaceholder="Search jobs…"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <p className="p-4 text-destructive">Could not load your jobs.</p>
            ) : !data?.results.length ? (
              <p className="p-6 text-sm text-muted-foreground">
                No job orders found for your account.
              </p>
            ) : (
              <div>
                {data.results.map((job: JobOrder) => (
                  <ClientResultsJobRow
                    key={job.id}
                    job={job}
                    selected={selectedJobId === job.id}
                    onSelect={() => openJob(job.id)}
                  />
                ))}
              </div>
            )}
            {data && data.count > 0 ? (
              <TablePaginationFooter
                page={page}
                pageSize={pageSize}
                count={data.count}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        </div>

        {selectedJobId ? (
          <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[420px] lg:shrink-0 lg:self-start">
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
              ) : detailError && !displayJob ? (
                <div className="flex h-full flex-col justify-center gap-2 border-l border-border bg-card p-4 text-sm text-destructive">
                  Could not load this job. It may have been removed or you may not have access.
                  <Button type="button" variant="outline" size="sm" onClick={closeJob}>
                    Close
                  </Button>
                </div>
              ) : displayJob ? (
                <ClientResultsJobDetailPanel
                  jobId={selectedJobId}
                  listJob={displayJob}
                  onClose={closeJob}
                />
              ) : (
                <div className="flex h-full items-center justify-center border-l border-border bg-card p-4 text-sm text-muted-foreground">
                  Job not found.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
