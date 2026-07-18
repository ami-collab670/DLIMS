import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";
import { StaffCompliancePriorityAlerts } from "./staff-compliance-priority-alerts";
import { StaffComplaintsSection } from "./staff-complaints-section";

export default function StaffCompliancePage() {
  return (
    <div className="space-y-8">
      <LimsPageIntro title="Documents &amp; compliance">
        <p>
          Track client complaints, investigations, and resolutions. Operational
          traceability for jobs also uses status notes and role holds elsewhere
          in LSIMS.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <StaffCompliancePriorityAlerts />

      <StaffComplaintsSection />
    </div>
  );
}
