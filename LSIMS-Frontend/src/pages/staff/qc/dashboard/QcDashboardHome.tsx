import { StaffDashboardIntro } from "@/pages/staff/dashboard-home/staff-dashboard-intro";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

import {
  QcDashboardInboxPreview,
  QcDashboardKpiGrid,
  QcDashboardRecentDecisions,
} from "./qc-dashboard-widgets";
import { QcDashboardQuickLinks } from "./qc-dashboard-quick-links";

export default function QcDashboardHome() {
  return (
    <div className="space-y-8">
      <StaffDashboardIntro />
      <StaffRoleBanner />
      <QcDashboardKpiGrid />
      <QcDashboardQuickLinks />
      <div className="grid gap-6 lg:grid-cols-2">
        <QcDashboardInboxPreview />
        <QcDashboardRecentDecisions />
      </div>
      <p className="text-xs text-muted-foreground">
        Your QC view is limited to analysis results in your assigned department. Client identity
        and other departments are not shown.
      </p>
    </div>
  );
}
