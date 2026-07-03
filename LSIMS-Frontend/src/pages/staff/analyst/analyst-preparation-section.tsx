import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completePreparationRecord,
  fetchPreparationRecords,
  startPreparationRecord,
} from "@/features/laboratory/preparation-records-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import type { PreparationRecord } from "@/types/laboratory";

export function AnalystPreparationSection() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PreparationRecord | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: laboratoryQueryKeys.preparationRecords({ scope: "bench" }),
    queryFn: () => fetchPreparationRecords({ page: 1 }),
    staleTime: 20_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["preparation-records"] });
  };

  const startMut = useMutation({
    mutationFn: (id: string) => startPreparationRecord(id),
    onSuccess: () => {
      toast.success("Preparation started.");
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

  const rows = data?.results ?? [];

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold">Preparation records</h3>
        <p className="text-xs text-muted-foreground">
          Start and complete sample prep via{" "}
          <code className="rounded bg-muted px-1">preparation-records</code> workflow actions.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load preparation records.</p>
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
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.sample_code ?? r.sample_name}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.reference_code}</td>
                  <td className="px-3 py-2 capitalize">{r.status.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.technician_email ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {r.status === "pending" ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={startMut.isPending}
                          onClick={() => startMut.mutate(r.id)}
                        >
                          Start
                        </Button>
                      ) : null}
                      {r.status === "in_progress" ? (
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

      {!isLoading && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No preparation records assigned yet.</p>
      ) : null}

      {selected ? (
        <div className="space-y-3 rounded-md border p-3">
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
    </section>
  );
}
