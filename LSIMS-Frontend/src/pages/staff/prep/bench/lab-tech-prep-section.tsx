import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import {
  completePreparationRecord,
  fetchPreparationRecords,
  startPreparationRecord,
} from "@/features/laboratory/api";
import { getApiErrorMessage } from "@/lib/api";
import { staffPreparationSampleCode } from "@/lib/laboratory";
import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { PreparationRecord, PreparationStatus } from "@/types/laboratory";

import {
  canClaimPrepRecord,
  filterMyPrepRecords,
  LAB_TECH_PREP_PAGE_SIZE,
} from "@/lib/laboratory/prep/desk-utils";

type StatusTab = "all" | PreparationStatus;

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
];

export function LabTechPrepSection() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [selected, setSelected] = useState<PreparationRecord | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: laboratoryQueryKeys.preparationRecords({
      scope: "lab-tech-bench",
      status: statusTab === "all" ? undefined : statusTab,
    }),
    queryFn: () =>
      fetchPreparationRecords({
        page: 1,
        page_size: 200,
        status: statusTab === "all" ? undefined : statusTab,
      }),
    staleTime: 20_000,
  });

  const visibleRows = useMemo(() => {
    return filterMyPrepRecords(data?.results ?? [], userId);
  }, [data?.results, userId]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * LAB_TECH_PREP_PAGE_SIZE;
    return visibleRows.slice(start, start + LAB_TECH_PREP_PAGE_SIZE);
  }, [page, visibleRows]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["preparation-records"] });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.labTechDeskKpis });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.labTechDeskQueuePreview });
  };

  const startMut = useMutation({
    mutationFn: (id: string) => startPreparationRecord(id),
    onSuccess: () => {
      toast.success("Preparation started — assigned to you.");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const completeMut = useMutation({
    mutationFn: () =>
      completePreparationRecord(selected!.id, {
        notes: completeNotes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Preparation completed.");
      setSelected(null);
      setCompleteNotes("");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant={statusTab === tab.id ? "default" : "outline"}
            onClick={() => {
              setStatusTab(tab.id);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">Could not load preparation records.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 font-medium">Sample</th>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Technician</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2 font-mono text-xs">
                      {staffPreparationSampleCode(r)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.reference_code}</td>
                    <td className="px-3 py-2 capitalize">{r.status.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.technician_email ?? (r.status === "pending" ? "Unassigned" : "—")}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {r.status === "pending" && canClaimPrepRecord(r, userId) ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={startMut.isPending}
                            onClick={() => startMut.mutate(r.id)}
                          >
                            Start
                          </Button>
                        ) : null}
                        {r.status === "in_progress" && r.technician === userId ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelected(r);
                              setCompleteNotes(r.notes ?? "");
                            }}
                          >
                            Complete…
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && visibleRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No preparation records in your queue.
          </p>
        ) : null}

        <TablePaginationFooter
          page={page}
          pageSize={LAB_TECH_PREP_PAGE_SIZE}
          count={visibleRows.length}
          onPageChange={setPage}
          isFetching={isFetching}
        />
      </div>

      {selected ? (
        <div className="space-y-3 rounded-md border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium">
            Complete prep — {selected.reference_code}
          </p>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={completeMut.isPending}
              onClick={() => completeMut.mutate()}
            >
              Confirm complete
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        You only see preparation work assigned to you or pending records you can claim on Start.
        Other technicians&apos; in-progress work is hidden.
      </p>
    </section>
  );
}
