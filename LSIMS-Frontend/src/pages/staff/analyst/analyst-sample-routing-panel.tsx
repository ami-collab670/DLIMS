import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DepartmentLabTechOption } from "@/lib/staff/qc-manager/lab-tech-directory";
import type { PreparationRecord } from "@/types/laboratory";

import { AnalystSampleAnalystAssign } from "./analyst-sample-analyst-assign";

type AnalystOption = { id: string; email: string };

type AnalystSampleRoutingPanelProps = {
  awaitingPayment: boolean;
  analystDirectoryLoading: boolean;
  analystOptions: AnalystOption[];
  selectedAnalystId: string;
  onSelectedAnalystIdChange: (value: string) => void;
  onAnalystSelectionTouched: () => void;
  reassignedReason: string;
  onReassignedReasonChange: (value: string) => void;
  analystSelectionChanged: boolean;
  assignAnalystPending: boolean;
  canAssignAnalystUuid: boolean;
  onAssignAnalyst: () => void;
  canCreatePrep: boolean;
  prepLoading: boolean;
  prepRecord: PreparationRecord | undefined;
  hasAssignedTests: boolean;
  labTechDirectoryLoading: boolean;
  labTechDirectory: DepartmentLabTechOption[];
  selectedLabTechId: string;
  onSelectedLabTechIdChange: (value: string) => void;
  createPrepPending: boolean;
  onCreatePrep: () => void;
};

export function AnalystSampleRoutingPanel({
  awaitingPayment,
  analystDirectoryLoading,
  analystOptions,
  selectedAnalystId,
  onSelectedAnalystIdChange,
  onAnalystSelectionTouched,
  reassignedReason,
  onReassignedReasonChange,
  analystSelectionChanged,
  assignAnalystPending,
  canAssignAnalystUuid,
  onAssignAnalyst,
  canCreatePrep,
  prepLoading,
  prepRecord,
  hasAssignedTests,
  labTechDirectoryLoading,
  labTechDirectory,
  selectedLabTechId,
  onSelectedLabTechIdChange,
  createPrepPending,
  onCreatePrep,
}: AnalystSampleRoutingPanelProps) {
  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div>
        <p className="text-sm font-medium">Route sample</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Assign an analyst, create a preparation record, and optionally pre-assign a lab technician
          in your department.
        </p>
      </div>

      <AnalystSampleAnalystAssign
        awaitingPayment={awaitingPayment}
        analystDirectoryLoading={analystDirectoryLoading}
        analystOptions={analystOptions}
        selectedAnalystId={selectedAnalystId}
        onSelectedAnalystIdChange={onSelectedAnalystIdChange}
        onAnalystSelectionTouched={onAnalystSelectionTouched}
        reassignedReason={reassignedReason}
        onReassignedReasonChange={onReassignedReasonChange}
        analystSelectionChanged={analystSelectionChanged}
        assignPending={assignAnalystPending}
        canAssign={canAssignAnalystUuid}
        onAssign={onAssignAnalyst}
      />

      {canCreatePrep ? (
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Preparation routing</p>
          {awaitingPayment ? (
            <p className="text-xs text-muted-foreground">
              Preparation records can be created after finance clears the sample.
            </p>
          ) : prepLoading ? (
            <p className="text-xs text-muted-foreground">Loading preparation status…</p>
          ) : prepRecord ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Prep reference</dt>
                <dd className="font-mono text-xs">{prepRecord.reference_code}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="capitalize">{prepRecord.status.replace(/_/g, " ")}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Lab technician</dt>
                <dd>
                  {prepRecord.technician_email?.trim()
                    ? prepRecord.technician_email
                    : "Unassigned (claimable by any dept lab tech on Start)"}
                </dd>
              </div>
            </dl>
          ) : !hasAssignedTests ? (
            <p className="text-xs text-muted-foreground">
              Assign at least one test to this sample before creating a preparation record.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Creates a prep bench record for lab technicians. Leave technician unassigned if any
                lab tech in your department should be able to claim it on Start.
              </p>
              {labTechDirectoryLoading ? (
                <p className="text-xs text-muted-foreground">Loading lab technicians…</p>
              ) : (
                <div className="space-y-1">
                  <Label>Lab technician (optional)</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={selectedLabTechId}
                    onChange={(e) => onSelectedLabTechIdChange(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {labTechDirectory.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.email}
                      </option>
                    ))}
                  </select>
                  {labTechDirectory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No lab technicians in directory yet — you can still create the prep record
                      unassigned.
                    </p>
                  ) : null}
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={createPrepPending}
                onClick={onCreatePrep}
              >
                Create preparation record
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
