import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Label } from "@/components/ui/label";
import { fetchSample, fetchSamples } from "@/features/laboratory/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import { shortJobId } from "@/lib/laboratory";
import {
  sortRowsClientSide,
  type SortState,
  type TablePageSize,
} from "@/lib/table";
import { cn } from "@/lib/ui";
import type { SampleRecord } from "@/types/laboratory";

import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/table";

import { SAMPLE_STATUS_OPTIONS } from "@/lib/staff/samples/constants";
import { NewSampleForm } from "./new-sample-form";
import { SampleDetailPanel } from "./sample-detail-panel";

type SampleSortKey = "sample_code" | "sample_name" | "job" | "sample_status" | "assigned_analyst";

const DEFAULT_SAMPLE_SORT: SortState<SampleSortKey> = {
  key: "sample_code",
  direction: "asc",
};

function rowLabel(s: SampleRecord): string {
  if (s.sample_name?.trim()) return s.sample_name;
  if (s.blind_alias_code) return s.blind_alias_code;
  return "—";
}

export function StaffSamplesSection({
  intake,
  manage,
}: {
  intake: boolean;
  manage: boolean;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(DEFAULT_TABLE_PAGE_SIZE);
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState(DEFAULT_SAMPLE_SORT);

  useEffect(() => setPage(1), [debounced, jobFilter, statusFilter, pageSize]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["staff-samples", page, pageSize, jobFilter, statusFilter, debounced],
    queryFn: () =>
      fetchSamples({
        page,
        page_size: pageSize,
        job: jobFilter || undefined,
        sample_status: statusFilter || undefined,
        search: debounced || undefined,
      }),
  });

  const { data: detail } = useQuery({
    queryKey: ["staff-sample", selectedId],
    queryFn: () => fetchSample(selectedId!),
    enabled: Boolean(selectedId),
  });

  const handleSort = useCallback((key: SampleSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }, []);

  // API has no ordering param — sort current page only.
  const rows = useMemo(() => {
    const base = data?.results ?? [];
    return sortRowsClientSide(base, sort, (row, key) => {
      switch (key as SampleSortKey) {
        case "sample_code":
          return row.sample_code ?? row.blind_alias_code ?? "";
        case "sample_name":
          return rowLabel(row);
        case "job":
          return row.job ?? "";
        case "sample_status":
          return row.sample_status;
        case "assigned_analyst":
          return row.assigned_analyst ?? "";
        default:
          return "";
      }
    });
  }, [data?.results, sort]);

  return (
    <div className="space-y-4">
      {intake ? (
        <NewSampleForm
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["staff-samples"] });
            queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
          }}
        />
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Only receptionists can register new samples.
        </p>
      )}

      <TableToolbar
        searchPlaceholder="Code or name…"
        searchValue={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      >
        <div className="min-w-[200px] space-y-1 lg:w-72">
          <Label>Filter by job ID</Label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
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
            {SAMPLE_STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </TableToolbar>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-destructive">{getApiErrorMessage(error)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <SortableTableHead
                    label="Code"
                    sortKey="sample_code"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Name / blind"
                    sortKey="sample_name"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Job"
                    sortKey="job"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Status"
                    sortKey="sample_status"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Analyst"
                    sortKey="assigned_analyst"
                    sort={sort}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className={cn(
                      "cursor-pointer border-b hover:bg-muted/40",
                      selectedId === s.id && "bg-muted/50",
                    )}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {s.sample_code ??
                        (s.blind_alias_code ? (
                          <span title="Permanent code pending payment">{s.blind_alias_code}</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300">Pending code</span>
                        ))}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2">{rowLabel(s)}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {s.job ? shortJobId(s.job) : "—"}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      {s.sample_status.replace(/_/g, " ")}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-2 text-muted-foreground">
                      {s.assigned_analyst ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {selectedId && detail ? (
        <SampleDetailPanel
          sample={detail}
          manage={manage}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["staff-samples"] });
            queryClient.invalidateQueries({ queryKey: ["staff-sample", selectedId] });
          }}
        />
      ) : null}
    </div>
  );
}
