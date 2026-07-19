import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

import { StaffDashboardIntro } from "@/pages/staff/dashboard-home/staff-dashboard-intro";

import { ReceptionistIntakeQueue } from "./receptionist-intake-queue";
import { ReceptionistKpiGrid } from "./receptionist-dashboard-kpis";
import { ReceptionistQuickActions } from "./receptionist-quick-actions";
import { ReceptionistRecentMessages } from "./receptionist-recent-messages";

export default function ReceptionistDashboardHome() {
  return (
    <div className="space-y-8">
      <StaffDashboardIntro />
      <StaffRoleBanner />
      <ReceptionistKpiGrid />
      <ReceptionistQuickActions />
      <ReceptionistIntakeQueue />
      <ReceptionistRecentMessages />
    </div>
  );
}
