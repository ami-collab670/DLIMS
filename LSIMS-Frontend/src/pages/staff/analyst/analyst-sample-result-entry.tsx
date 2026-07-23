import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SampleRecord } from "@/types/laboratory";

import { AnalystCalibrationSection } from "./analyst-calibration-section";

type AnalystSampleResultEntryProps = {
  sampleTests: SampleRecord["sample_tests"];
  resultSampleTest: string;
  onResultSampleTestChange: (value: string) => void;
  resultValue: string;
  onResultValueChange: (value: string) => void;
  resultUnit: string;
  onResultUnitChange: (value: string) => void;
  activeDraftId: string | null;
  isRejectedDraft: boolean;
  saveDraftPending: boolean;
  submitPending: boolean;
  onSaveDraft: () => void;
  onSubmitResult: () => void;
};

export function AnalystSampleResultEntry({
  sampleTests,
  resultSampleTest,
  onResultSampleTestChange,
  resultValue,
  onResultValueChange,
  resultUnit,
  onResultUnitChange,
  activeDraftId,
  isRejectedDraft,
  saveDraftPending,
  submitPending,
  onSaveDraft,
  onSubmitResult,
}: AnalystSampleResultEntryProps) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Enter analysis result</p>
      <p className="text-xs text-muted-foreground">
        Save a draft, add calibrations below, then submit to your department QC manager.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label>Sample-test assignment</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={resultSampleTest}
            onChange={(e) => onResultSampleTestChange(e.target.value)}
          >
            {sampleTests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.test_code} — {t.test_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Value</Label>
          <Input value={resultValue} onChange={(e) => onResultValueChange(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Unit</Label>
          <Input value={resultUnit} onChange={(e) => onResultUnitChange(e.target.value)} />
        </div>
      </div>
      {activeDraftId ? (
        <p className="text-xs text-muted-foreground">
          Draft saved
          {isRejectedDraft ? " (rejected — revise and resubmit)" : ""}.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!resultSampleTest || !resultValue.trim() || saveDraftPending}
          onClick={onSaveDraft}
        >
          Save draft
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={
            !resultSampleTest || !resultValue.trim() || submitPending || saveDraftPending
          }
          onClick={onSubmitResult}
        >
          Submit for QC
        </Button>
      </div>
      {activeDraftId ? (
        <AnalystCalibrationSection analysisResultId={activeDraftId} />
      ) : null}
    </div>
  );
}
