import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSample, fetchSamples } from "@/features/laboratory/staff-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import {
  staffSampleDisplayCode,
  staffSampleRowLabel,
} from "@/lib/sample-reference-display";
import { cn } from "@/lib/utils";

import {
  ANALYST_LIST_PAGE_SIZE,
  ANALYST_SAMPLE_STATUS_OPTIONS,
} from "./analyst-workspace-constants";
import { AnalystPreparationSection } from "./analyst-preparation-section";
import { AnalystSampleDetailPanel } from "./analyst-sample-detail-panel";
import { RegisterSampleForm } from "./register-sample-form";

export function StaffAnalystSection({
  intake,
  manage,
  isAnalyst,
  hideClientSampleNames,
}: {
  intake: boolean;
  manage: boolean;
  isAnalyst: boolean;
  hideClientSampleNames: boolean;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["staff-analyst", "list", page, jobFilter, statusFilter, debounced],
    queryFn: () =>
      fetchSamples({
        page,
        job: jobFilter || undefined,
        sample_status: statusFilter || undefined,
        search: debounced || undefined,
      }),
  });

  const { data: detail } = useQuery({
    queryKey: ["staff-analyst", "detail", selectedId],
    queryFn: () => fetchSample(selectedId!),
    enabled: Boolean(selectedId),
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.count / ANALYST_LIST_PAGE_SIZE))
    : 1;

  return (
    <div className="space-y-4">

      <AnalystPreparationSection />

      {intake ? (
        <RegisterSampleForm
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["staff-analyst"] });
            queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
          }}
        />
      ) : isAnalyst ? (
        <div
          role="note"
          className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
        >
          <p className="font-medium text-foreground">Bench view (read-only)</p>
          <p className="mt-1">
            Reception registers samples and assigns them to analysts here. Only items assigned to you
            appear in this list. Use Laboratory → Jobs if you need more operational context after
            handoff from staff.
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Only receptionists can register new samples.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:flex-wrap">
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label>Search</Label>
          <Input
            placeholder={
              hideClientSampleNames || isAnalyst
                ? "Blind code / technical label…"
                : "Code or name…"
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[200px] space-y-1 lg:w-72">
          <Label>Filter by job ID</Label>
          <Input
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
            {ANALYST_SAMPLE_STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-destructive">{getApiErrorMessage(error)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">
                    {hideClientSampleNames ? "Blind label" : "Name / blind"}
                  </th>
                  {isAnalyst ? null : (
                    <>
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium">Analyst</th>
                    </>
                  )}
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.results.map((s) => (
                  <tr
                    key={s.id}
                    className={cn(
                      "cursor-pointer border-b hover:bg-muted/40",
                      selectedId === s.id && "bg-muted/50",
                    )}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {staffSampleDisplayCode(s)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2">
                      {staffSampleRowLabel(s, hideClientSampleNames)}
                    </td>
                    {isAnalyst ? null : (
                      <>
                        <td className="px-4 py-2 font-mono text-xs">
                          {s.job ? shortJobId(s.job) : "—"}
                        </td>
                        <td className="max-w-[140px] truncate px-4 py-2 text-muted-foreground">
                          {s.assigned_analyst ?? "—"}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2 capitalize">
                      {s.sample_status.replace(/_/g, " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 0 ? (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              {(page - 1) * ANALYST_LIST_PAGE_SIZE + 1}–
              {Math.min(page * ANALYST_LIST_PAGE_SIZE, data.count)} / {data.count}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {selectedId && detail ? (
        <AnalystSampleDetailPanel
          sample={detail}
          manage={manage}
          hideClientSampleNames={hideClientSampleNames}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["staff-analyst"] });
            queryClient.invalidateQueries({
              queryKey: ["staff-analyst", "detail", selectedId],
            });
          }}
        />
      ) : null}
    </div>
  );
}
