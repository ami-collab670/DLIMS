import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { Label } from "@/components/ui/label";
import { fetchAnalysisResult } from "@/features/laboratory/api";
import { fetchQCDecisions } from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { getApiErrorMessage } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { QC_DESK_PAGE_SIZE } from "@/lib/staff/qc/constants";
import { formatDecidedAt } from "@/lib/formatting";
import type { AnalysisResult, QCDecision, QCDecisionValue } from "@/types/laboratory";

type EnrichedDecision = QCDecision & {
  resultDetail?: AnalysisResult | null;
};

export default function QcHistoryPage() {
  const [page, setPage] = useState(1);
  const [decisionFilter, setDecisionFilter] = useState<QCDecisionValue | "">("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [analystFilter, setAnalystFilter] = useState("");
  const [testFilter, setTestFilter] = useState("");

  const listParams = useMemo(
    () => ({
      page,
      page_size: QC_DESK_PAGE_SIZE,
      decision: decisionFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    [page, decisionFilter, debouncedSearch],
  );

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: laboratoryQueryKeys.qcDecisions(listParams),
    queryFn: () => fetchQCDecisions(listParams),
    staleTime: 30_000,
  });

  const { data: enrichedRows = [], isLoading: enrichLoading } = useQuery({
    queryKey: ["qc-history-enriched", listParams, data?.results.map((d) => d.id).join(",")],
    queryFn: async (): Promise<EnrichedDecision[]> => {
      const decisions = data?.results ?? [];
      const details = await Promise.all(
        decisions.map(async (d) => {
          try {
            const resultDetail = await fetchAnalysisResult(d.analysis_result);
            return { ...d, resultDetail };
          } catch {
            return { ...d, resultDetail: null };
          }
        }),
      );
      return details;
    },
    enabled: Boolean(data?.results.length),
  });

  const filteredRows = useMemo(() => {
    let rows = enrichedRows;
    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`).getTime();
      rows = rows.filter((d) => new Date(d.decided_at).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`).getTime();
      rows = rows.filter((d) => new Date(d.decided_at).getTime() <= to);
    }
    if (analystFilter.trim()) {
      const q = analystFilter.trim().toLowerCase();
      rows = rows.filter((d) =>
        d.resultDetail?.analyst_email?.toLowerCase().includes(q),
      );
    }
    if (testFilter.trim()) {
      const q = testFilter.trim().toLowerCase();
      rows = rows.filter(
        (d) =>
          d.resultDetail?.test_code?.toLowerCase().includes(q) ||
          d.resultDetail?.test_name?.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [enrichedRows, dateFrom, dateTo, analystFilter, testFilter]);

  const analystOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of enrichedRows) {
      if (row.resultDetail?.analyst_email) set.add(row.resultDetail.analyst_email);
    }
    return [...set].sort();
  }, [enrichedRows]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">QC decision history</h3>
        <p className="text-xs text-muted-foreground">
          Audit trail for approvals and rejections in your department.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label>Decision</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={decisionFilter}
            onChange={(e) => {
              setDecisionFilter(e.target.value as QCDecisionValue | "");
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>Search reason / reviewer</Label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Reason or email…"
          />
        </div>
        <div className="space-y-1">
          <Label>Analyst email</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={analystFilter}
            onChange={(e) => setAnalystFilter(e.target.value)}
          >
            <option value="">All analysts</option>
            {analystOptions.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Test (code or name)</Label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={testFilter}
            onChange={(e) => setTestFilter(e.target.value)}
            placeholder="Filter on this page…"
          />
        </div>
        <div className="space-y-1">
          <Label>From date</Label>
          <input
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>To date</Label>
          <input
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading || enrichLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">{getApiErrorMessage(error)}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Decision</th>
                  <th className="px-4 py-2 font-medium">Test</th>
                  <th className="px-4 py-2 font-medium">Sample</th>
                  <th className="px-4 py-2 font-medium">Analyst</th>
                  <th className="px-4 py-2 font-medium">Decided by</th>
                  <th className="px-4 py-2 font-medium">Reason</th>
                  <th className="px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="px-4 py-2 capitalize">{d.decision}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {d.resultDetail
                        ? `${d.resultDetail.test_code} — ${d.resultDetail.test_name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {d.resultDetail?.sample_code ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {d.resultDetail?.analyst_email ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">{d.decided_by_email ?? "—"}</td>
                    <td className="max-w-[200px] truncate px-4 py-2 text-xs">
                      {d.reason || "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {formatDecidedAt(d.decided_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !enrichLoading && filteredRows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No decisions match your filters.</p>
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
