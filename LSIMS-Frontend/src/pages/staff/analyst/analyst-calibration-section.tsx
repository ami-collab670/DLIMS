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
} from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { getApiErrorMessage } from "@/lib/api";

type Props = {
  analysisResultId: string;
};

export function AnalystCalibrationSection({ analysisResultId }: Props) {
  const queryClient = useQueryClient();
  const [instrumentName, setInstrumentName] = useState("");
  const [calibrationReference, setCalibrationReference] = useState("");
  const [calibrationDate, setCalibrationDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: laboratoryQueryKeys.calibrationRecords({ analysis_result: analysisResultId }),
    queryFn: () => fetchCalibrationRecords({ page: 1, analysis_result: analysisResultId }),
    enabled: Boolean(analysisResultId),
  });

  const rows = data?.results ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: laboratoryQueryKeys.calibrationRecords({ analysis_result: analysisResultId }),
    });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createCalibrationRecord({
        analysis_result: analysisResultId,
        instrument_name: instrumentName.trim(),
        calibration_reference: calibrationReference.trim() || undefined,
        calibration_date: calibrationDate.trim() || null,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Calibration record added.");
      setInstrumentName("");
      setCalibrationReference("");
      setCalibrationDate("");
      setNotes("");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCalibrationRecord,
    onSuccess: () => {
      toast.success("Calibration removed.");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <div>
        <p className="text-sm font-medium">Instrument calibration</p>
        <p className="text-xs text-muted-foreground">
          Link calibration data to your draft result before submitting for QC.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length ? (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{r.instrument_name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.calibration_reference || "No reference"}
                  {r.calibration_date ? ` · ${r.calibration_date}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (confirm("Remove this calibration record?")) {
                    deleteMut.mutate(r.id);
                  }
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No calibrations linked yet.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label>Instrument name</Label>
          <Input
            value={instrumentName}
            onChange={(e) => setInstrumentName(e.target.value)}
            placeholder="e.g. ICP-OES #2"
          />
        </div>
        <div className="space-y-1">
          <Label>Reference</Label>
          <Input
            value={calibrationReference}
            onChange={(e) => setCalibrationReference(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Calibration date</Label>
          <Input
            type="date"
            value={calibrationDate}
            onChange={(e) => setCalibrationDate(e.target.value)}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Notes</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!instrumentName.trim() || createMut.isPending}
        onClick={() => createMut.mutate()}
      >
        Add calibration
      </Button>
    </div>
  );
}
