import { StaffDashboardIntro } from "@/pages/staff/dashboard-home/staff-dashboard-intro";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

import {
  AnalystDashboardAssignedPreview,
  AnalystDashboardKpiGrid,
  AnalystDashboardRecentSubmissions,
} from "./analyst-dashboard-widgets";
import { AnalystDashboardQuickLinks } from "./analyst-dashboard-quick-links";

export default function AnalystDashboardHome() {
  return (
    <div className="space-y-8">
      <StaffDashboardIntro />
      <StaffRoleBanner />
      <AnalystDashboardKpiGrid />
      <AnalystDashboardQuickLinks />
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalystDashboardAssignedPreview />
        <AnalystDashboardRecentSubmissions />
      </div>
      <p className="text-xs text-muted-foreground">
        Your bench shows only samples assigned to your analyst account. Client identity is hidden;
        enter results and calibrations from the sample detail panel, then submit to your department
        QC manager.
      </p>
    </div>
  );
}
