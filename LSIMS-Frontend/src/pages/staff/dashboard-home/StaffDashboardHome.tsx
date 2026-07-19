import { isFinance, isReceptionist, isStaffAdmin, staffRoleName } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import FinanceDashboardHome from "@/pages/staff/finance/dashboard/FinanceDashboardHome";
import ReceptionistDashboardHome from "@/pages/staff/receptionist/dashboard/ReceptionistDashboardHome";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

import { StaffAdminPromoCard } from "./staff-admin-promo-card";
import { StaffDashboardAttentionQueue } from "./staff-dashboard-attention-queue";
import { StaffDashboardIntro } from "./staff-dashboard-intro";
import { StaffDashboardJobPipeline } from "./staff-dashboard-job-pipeline";
import { StaffDashboardPriorityAlerts } from "./staff-dashboard-priority-alerts";
import { StaffDashboardQuickLinks } from "./staff-dashboard-quick-links";
import { StaffDashboardRecentJobs } from "./staff-dashboard-recent-jobs";
import { StaffDashboardSampleSnapshot } from "./staff-dashboard-sample-snapshot";
import { StaffDashboardStatsGrid } from "./staff-dashboard-stats-grid";

export default function StaffDashboardHome() {
  const user = useAuthStore((s) => s.user);
  const showAdmin = isStaffAdmin(user);
  const isAnalyst = staffRoleName(user) === "analyst";
  const receptionist = isReceptionist(user);
  const finance = isFinance(user);

  if (finance) {
    return <FinanceDashboardHome />;
  }

  if (receptionist) {
    return <ReceptionistDashboardHome />;
  }

  return (
    <div className="space-y-8">
      <StaffDashboardIntro />
      <StaffRoleBanner />
      {showAdmin ? <StaffAdminPromoCard /> : null}
      <StaffDashboardPriorityAlerts />
      <StaffDashboardQuickLinks />
      {!isAnalyst ? <StaffDashboardAttentionQueue /> : null}
      <StaffDashboardJobPipeline />
      <StaffDashboardSampleSnapshot />
      <StaffDashboardStatsGrid />
      <StaffDashboardRecentJobs />
    </div>
  );
}
