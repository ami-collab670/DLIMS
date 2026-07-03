import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCalibrationRecord,
  deleteCalibrationRecord,
  fetchCalibrationRecords,
  patchCalibrationRecord,
} from "@/features/laboratory/calibration-records-api";
import { fetchAnalysisResults } from "@/features/laboratory/analysis-results-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import type { CalibrationRecord } from "@/types/laboratory";

import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

export default function StaffInstrumentsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CalibrationRecord | null>(null);
  const [form, setForm] = useState({
    analysis_result: "",
    instrument_name: "",
    calibration_reference: "",
    calibration_date: "",
    notes: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: laboratoryQueryKeys.calibrationRecords(),
    queryFn: () => fetchCalibrationRecords({ page: 1 }),
    staleTime: 30_000,
  });

  const { data: approvedResults } = useQuery({
    queryKey: laboratoryQueryKeys.analysisResults({ state: "approved" }),
    queryFn: () => fetchAnalysisResults({ page: 1, state: "approved" }),
    staleTime: 60_000,
  });
  const resultOptions = approvedResults?.results ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["calibration-records"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createCalibrationRecord({
        analysis_result: form.analysis_result.trim(),
        instrument_name: form.instrument_name.trim(),
        calibration_reference: form.calibration_reference.trim() || undefined,
        calibration_date: form.calibration_date.trim() || null,
        notes: form.notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Calibration record created.");
      setShowCreate(false);
      setForm({
        analysis_result: "",
        instrument_name: "",
        calibration_reference: "",
        calibration_date: "",
        notes: "",
      });
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const patchMut = useMutation({
    mutationFn: () =>
      patchCalibrationRecord(editing!.id, {
        instrument_name: form.instrument_name.trim(),
        calibration_reference: form.calibration_reference.trim(),
        calibration_date: form.calibration_date.trim() || null,
        notes: form.notes.trim(),
      }),
    onSuccess: () => {
      toast.success("Calibration updated.");
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCalibrationRecord,
    onSuccess: () => {
      toast.success("Calibration deleted.");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rows = data?.results ?? [];

  function openEdit(record: CalibrationRecord) {
    setEditing(record);
    setForm({
      analysis_result: record.analysis_result,
      instrument_name: record.instrument_name,
      calibration_reference: record.calibration_reference,
      calibration_date: record.calibration_date?.slice(0, 10) ?? "",
      notes: record.notes,
    });
    setShowCreate(false);
  }

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Instruments &amp; equipment">
        <p>
          Calibration records linked to analysis results — instrument traceability for QC and
          audits.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <div className="flex justify-end">
        <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? "Cancel" : "Add calibration"}
        </Button>
      </div>

      {(showCreate || editing) && (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.instrument_name.trim()) {
              toast.error("Instrument name is required.");
              return;
            }
            if (editing) patchMut.mutate();
            else {
              if (!form.analysis_result.trim()) {
                toast.error("Analysis result ID is required.");
                return;
              }
              createMut.mutate();
            }
          }}
        >
          <p className="md:col-span-2 text-sm font-medium">
            {editing ? "Edit calibration" : "New calibration record"}
          </p>
          {!editing ? (
            <div className="space-y-1 md:col-span-2">
              <Label>Analysis result</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-sm"
                value={form.analysis_result}
                onChange={(e) =>
                  setForm((f) => ({ ...f, analysis_result: e.target.value }))
                }
              >
                <option value="">Select approved result…</option>
                {resultOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.test_code} — {r.value} {r.unit} ({r.sample_code ?? r.sample.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="space-y-1">
            <Label>Instrument</Label>
            <Input
              value={form.instrument_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, instrument_name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Calibration reference</Label>
            <Input
              value={form.calibration_reference}
              onChange={(e) =>
                setForm((f) => ({ ...f, calibration_reference: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Calibration date</Label>
            <Input
              type="date"
              value={form.calibration_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, calibration_date: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={createMut.isPending || patchMut.isPending}>
              {editing ? "Save" : "Create"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setShowCreate(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-destructive">Could not load calibration records.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Instrument</th>
                  <th className="px-4 py-2 font-medium">Reference</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Analysis result</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-2">{r.instrument_name}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {r.calibration_reference || "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {r.calibration_date
                        ? new Date(r.calibration_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.analysis_result}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(r)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          disabled={deleteMut.isPending}
                          onClick={() => {
                            if (confirm("Delete this calibration record?")) {
                              deleteMut.mutate(r.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No calibration records yet.</p>
        ) : null}
      </div>
    </div>
  );
}
