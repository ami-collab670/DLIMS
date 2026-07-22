import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { fetchAnalysisResults } from "@/features/laboratory/api";
import { fetchQCDecisions } from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { getApiErrorMessage } from "@/lib/api";
import { QC_DESK_PAGE_SIZE } from "@/lib/staff/qc/constants";
import { formatSubmittedAt } from "@/lib/formatting";

export default function QcRejectedPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: laboratoryQueryKeys.analysisResults({
      state: "rejected",
      page,
      page_size: QC_DESK_PAGE_SIZE,
    }),
    queryFn: () =>
      fetchAnalysisResults({
        page,
        page_size: QC_DESK_PAGE_SIZE,
        state: "rejected",
      }),
    staleTime: 30_000,
  });

  const resultIds = useMemo(
    () => (data?.results ?? []).map((r) => r.id).join(","),
    [data?.results],
  );

  const { data: rejectReasons = {} as Record<string, string> } = useQuery({
    queryKey: ["qc-rejected-reasons", resultIds],
    queryFn: async (): Promise<Record<string, string>> => {
      const map: Record<string, string> = {};
      const rows = data?.results ?? [];
      await Promise.all(
        rows.map(async (r) => {
          try {
            const decisions = await fetchQCDecisions({
              analysis_result: r.id,
              decision: "rejected",
              page: 1,
            });
            const latest = decisions.results[0];
            if (latest?.reason) map[r.id] = latest.reason;
          } catch {
            /* ignore */
          }
        }),
      );
      return map;
    },
    enabled: Boolean(data?.results.length),
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Rejected results (follow-up)</h3>
        <p className="text-xs text-muted-foreground">
          Read-only list of results returned to analysts for correction. Analysts resubmit via
          their bench when ready.
        </p>
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
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Test</th>
                  <th className="px-4 py-2 font-medium">Sample</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Analyst</th>
                  <th className="px-4 py-2 font-medium">Rejected</th>
                  <th className="px-4 py-2 font-medium">Rev</th>
                  <th className="px-4 py-2 font-medium">Last rejection reason</th>
                </tr>
              </thead>
              <tbody>
                {(data?.results ?? []).map((r) => (
                  <tr key={r.id} className="border-b">
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
                      {formatSubmittedAt(r.rejected_at)}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{r.revision}</td>
                    <td className="max-w-[240px] truncate px-4 py-2 text-xs">
                      {rejectReasons[r.id] ?? r.remarks?.trim() ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && (data?.results.length ?? 0) === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No rejected results in your department.</p>
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
    </div>
  );
}
