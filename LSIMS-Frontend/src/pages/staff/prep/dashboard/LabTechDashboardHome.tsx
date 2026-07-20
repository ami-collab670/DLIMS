import { StaffDashboardIntro } from "@/pages/staff/dashboard-home/staff-dashboard-intro";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

import { LabTechDashboardQuickLinks } from "./lab-tech-dashboard-quick-links";
import {
  LabTechDashboardKpiGrid,
  LabTechDashboardQueuePreview,
} from "./lab-tech-dashboard-widgets";

export default function LabTechDashboardHome() {
  return (
    <div className="space-y-8">
      <StaffDashboardIntro />
      <StaffRoleBanner />
      <LabTechDashboardKpiGrid />
      <LabTechDashboardQuickLinks />
      <LabTechDashboardQueuePreview />
      <p className="text-xs text-muted-foreground">
        You only see preparation work assigned to you or pending records you can claim on Start.
        Other technicians&apos; in-progress work is hidden.
      </p>
    </div>
  );
}
