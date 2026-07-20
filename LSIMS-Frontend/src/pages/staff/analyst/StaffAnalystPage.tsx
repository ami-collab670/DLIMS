import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import {
  canAssignSampleAnalyst,
  canIntakeSamples,
  canPatchSampleDetails,
  isQcManager,
  isStaffAnalyst,
  isStaffLabTechnician,
} from "@/lib/staff-permissions";
import { shouldHideClientSampleNames } from "@/lib/sample-reference-display";
import { useAuthStore } from "@/stores/auth-store";

import { StaffAnalystSection } from "./staff-analyst-section";

export default function StaffAnalystPage() {
  const user = useAuthStore((s) => s.user);
  const intake = canIntakeSamples(user);
  const canPatchSample = canPatchSampleDetails(user);
  const canAssignAnalyst = canAssignSampleAnalyst(user);
  const analyst = isStaffAnalyst(user);
  const labTechnician = isStaffLabTechnician(user);
  const qcManager = isQcManager(user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {labTechnician
            ? "Preparation bench"
            : analyst
              ? "Assigned to you"
              : qcManager
                ? "Department assignment"
                : "Analyst"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {labTechnician ? (
            <>
              Lab technician workspace: complete preparation steps on assigned samples, then hand off
              to analysts for result entry and QC submission.
            </>
          ) : analyst ? (
            <>
              Work assigned to your analyst account. Listing is blind (no client identifiers);
              enter results on each sample detail panel and submit for QC.
            </>
          ) : qcManager ? (
            <>
              Assign analysts to samples released for laboratory work. Unreleased samples are
              hidden from this list. Client identifiers are not shown.
            </>
          ) : (
            <>
              Analyst workspace: browse and filter material, register intake (reception), and manage
              assignments and lifecycle fields permitted by the API for your role.
            </>
          )}
        </p>
      </div>

      <StaffRoleBanner />

      <StaffAnalystSection
        intake={intake}
        canPatchSample={canPatchSample}
        canAssignAnalyst={canAssignAnalyst}
        isAnalyst={analyst}
        hideClientSampleNames={shouldHideClientSampleNames(user)}
        filterAwaitingPayment={qcManager}
      />
    </div>
  );
}
