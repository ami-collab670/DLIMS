import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { fetchJobOrders } from "@/features/jobs/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { JOB_STATUS_LABEL, shortJobId } from "@/lib/job-order-labels";
import type { TablePageSize } from "@/lib/table-list-utils";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/table-list-utils";
import type { JobOrder } from "@/types/laboratory";

const RELEASED_STATUSES = new Set(["completed", "qc"]);

export default function ClientResultsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(DEFAULT_TABLE_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-job-orders", page, pageSize, debouncedSearch],
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My results</h2>
        <p className="text-sm text-muted-foreground">
          Track job progress here. Detailed analytical values will appear when the client results
          API is available — for now you can see workflow status from your job orders.
        </p>
      </div>

      <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
        Track intake under{" "}
        <Link to="/client/requests" className="text-primary underline-offset-4 hover:underline">
          My requests
        </Link>
        . Approved QC values are not yet exposed to client accounts on{" "}
        <code className="rounded bg-muted px-1">/result-summary/</code>.
      </div>

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
        ) : (
          <div className="divide-y">
            {data?.results.map((job: JobOrder) => {
              const statusLabel = JOB_STATUS_LABEL[job.current_status] ??
                job.current_status.replace(/_/g, " ");
              const mayHaveResults =
                RELEASED_STATUSES.has(job.current_status) || job.current_status === "completed";

              return (
                <div key={job.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm">{shortJobId(job.id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {statusLabel} · {job.sample_count} samples
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {mayHaveResults
                      ? "Results not released yet — your account cannot access the staff result summary endpoint. Check back after the client results API is enabled."
                      : "Results not released yet — this job is still in the laboratory workflow."}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        {data && data.count > 0 ? (
          <TablePaginationFooter
            page={page}
            pageSize={pageSize}
            count={data.count}
            onPageChange={setPage}
          />
        ) : !isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            No job orders found for your account.
          </p>
        ) : null}
      </div>
    </div>
  );
}
