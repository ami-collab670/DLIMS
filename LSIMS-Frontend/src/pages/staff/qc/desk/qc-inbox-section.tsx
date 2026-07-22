import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchAnalysisResults } from "@/features/laboratory/api";
import { fetchUrgentSampleIds } from "@/features/laboratory/lib/fetch-urgent-sample-ids";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { getApiErrorMessage } from "@/lib/api";
import { formatSubmittedAt } from "@/lib/formatting";
import { cn } from "@/lib/ui";
import { QC_DESK_PAGE_SIZE } from "@/lib/staff/qc/constants";
import {
  sortSubmittedResults,
  type QcInboxSortMode,
} from "@/lib/laboratory/qc/desk-utils";
import type { AnalysisResult } from "@/types/laboratory";

type Props = {
  selectedId: string | null;
  onSelect: (result: AnalysisResult) => void;
};

export function QcInboxSection({ selectedId, onSelect }: Props) {
  const [page, setPage] = useState(1);
  const [sortMode, setSortMode] = useState<QcInboxSortMode>("oldest");

  const { data: urgentSampleIds } = useQuery({
    queryKey: ["qc-urgent-sample-ids"],
    queryFn: fetchUrgentSampleIds,
    staleTime: 120_000,
    enabled: sortMode === "priority",
  });

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: laboratoryQueryKeys.analysisResults({
      state: "submitted",
      page,
      page_size: QC_DESK_PAGE_SIZE,
    }),
    queryFn: () =>
      fetchAnalysisResults({
        page,
        page_size: QC_DESK_PAGE_SIZE,
        state: "submitted",
      }),
    staleTime: 20_000,
  });

  const rows = useMemo(() => {
    const base = data?.results ?? [];
    return sortSubmittedResults(base, sortMode, urgentSampleIds);
  }, [data?.results, sortMode, urgentSampleIds]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Submitted results (awaiting QC)</h3>
          <p className="text-xs text-muted-foreground">
            Department-scoped inbox — select a row to review.
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sort</Label>
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={sortMode}
            onChange={(e) => {
              setSortMode(e.target.value as QcInboxSortMode);
              setPage(1);
            }}
          >
            <option value="oldest">Oldest submitted first</option>
            <option value="priority">Priority jobs first</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">{getApiErrorMessage(error)}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Test</th>
                  <th className="px-4 py-2 font-medium">Sample</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Analyst</th>
                  <th className="px-4 py-2 font-medium">Submitted</th>
                  <th className="px-4 py-2 font-medium">Rev</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "cursor-pointer border-b transition-colors hover:bg-muted/50",
                      selectedId === r.id && "bg-muted/60",
                    )}
                    onClick={() => onSelect(r)}
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {r.test_code} — {r.test_name}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {r.sample_code ?? r.sample}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {r.value} {r.unit}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {r.analyst_email ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {formatSubmittedAt(r.submitted_at)}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{r.revision}</td>
                    <td className="px-4 py-2">
                      <Button type="button" size="sm" variant="outline">
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No results awaiting QC review.</p>
        ) : null}
        {data && data.count > 0 ? (
          <TablePaginationFooter
            page={page}
            pageSize={QC_DESK_PAGE_SIZE}
            count={data.count}
            onPageChange={setPage}
            isFetching={isFetching && !isLoading}
          />
        ) : null}
      </div>
    </section>
  );
}
