import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AnalystOption = { id: string; email: string };

type AnalystSampleAnalystAssignProps = {
  awaitingPayment: boolean;
  analystDirectoryLoading: boolean;
  analystOptions: AnalystOption[];
  selectedAnalystId: string;
  onSelectedAnalystIdChange: (value: string) => void;
  onAnalystSelectionTouched: () => void;
  reassignedReason: string;
  onReassignedReasonChange: (value: string) => void;
  analystSelectionChanged: boolean;
  assignPending: boolean;
  canAssign: boolean;
  onAssign: () => void;
  heading?: string;
};

export function AnalystSampleAnalystAssign({
  awaitingPayment,
  analystDirectoryLoading,
  analystOptions,
  selectedAnalystId,
  onSelectedAnalystIdChange,
  onAnalystSelectionTouched,
  reassignedReason,
  onReassignedReasonChange,
  analystSelectionChanged,
  assignPending,
  canAssign,
  onAssign,
  heading = "Assign analyst",
}: AnalystSampleAnalystAssignProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{heading}</p>
      {awaitingPayment ? (
        <p className="text-xs text-muted-foreground">
          This sample is not yet released for laboratory work. Assign analysts after the permanent
          sample code is issued.
        </p>
      ) : analystDirectoryLoading ? (
        <p className="text-xs text-muted-foreground">Loading department analysts…</p>
      ) : analystOptions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No analysts found for your department yet. Analysts appear after they work on department
          samples or results, or ask an administrator.
        </p>
      ) : (
        <>
          <div className="space-y-1">
            <Label>Analyst</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={selectedAnalystId}
              onChange={(e) => {
                onAnalystSelectionTouched();
                onSelectedAnalystIdChange(e.target.value);
              }}
            >
              <option value="">Unassigned</option>
              {analystOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Reassignment reason</Label>
            <Input
              value={reassignedReason}
              onChange={(e) => onReassignedReasonChange(e.target.value)}
            />
          </div>
          {analystSelectionChanged ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={assignPending || !canAssign}
              onClick={onAssign}
            >
              Assign analyst
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
