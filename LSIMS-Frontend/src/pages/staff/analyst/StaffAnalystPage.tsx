import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import { shouldHideClientSampleNames } from "@/lib/sample-reference-display";
import { useAuthStore } from "@/stores/auth-store";

import { StaffAnalystSection } from "./staff-analyst-section";

export default function StaffAnalystPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My samples</h2>
        <p className="text-sm text-muted-foreground">
          Samples assigned to your analyst account. Listing is blind (no client identifiers).
          Save a draft result, add calibrations inline, then submit to your department QC manager.
        </p>
      </div>

      <StaffRoleBanner />

      <StaffAnalystSection
        intake={false}
        canPatchSample={false}
        canAssignAnalyst={false}
        isAnalyst
        hideClientSampleNames={shouldHideClientSampleNames(user)}
        hidePreparation
        analystBenchOnly
      />
    </div>
  );
}
