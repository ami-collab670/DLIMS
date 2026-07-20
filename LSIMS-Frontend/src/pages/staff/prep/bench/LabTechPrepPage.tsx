import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

import { LabTechPrepSection } from "./lab-tech-prep-section";

export default function LabTechPrepPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Preparation bench</h2>
        <p className="text-sm text-muted-foreground">
          Complete preparation steps on your assigned queue. Start unassigned pending records to
          claim them, then complete prep to hand off to analysts for result entry.
        </p>
      </div>

      <StaffRoleBanner />

      <LabTechPrepSection />
    </div>
  );
}
