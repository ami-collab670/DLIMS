import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AnalystSampleAdminEditProps = {
  isBlindView: boolean;
  hideClientSampleNames: boolean;
  sampleName: string;
  onSampleNameChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  patchPending: boolean;
  deletePending: boolean;
  onSave: () => void;
  onDelete: () => void;
};

export function AnalystSampleAdminEdit({
  isBlindView,
  hideClientSampleNames,
  sampleName,
  onSampleNameChange,
  notes,
  onNotesChange,
  patchPending,
  deletePending,
  onSave,
  onDelete,
}: AnalystSampleAdminEditProps) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Edit sample (reception/admin)</p>
      {!isBlindView && !hideClientSampleNames ? (
        <div className="space-y-1">
          <Label>Sample name</Label>
          <Input value={sampleName} onChange={(e) => onSampleNameChange(e.target.value)} />
        </div>
      ) : null}
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={3} value={notes} onChange={(e) => onNotesChange(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={patchPending}>
          Save metadata
        </Button>
        <Button type="button" variant="destructive" disabled={deletePending} onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
