import { isStaffAdmin, staffRoleName } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

import { StaffAdminPromoCard } from "./staff-admin-promo-card";
import { StaffDashboardAttentionQueue } from "./staff-dashboard-attention-queue";
import { StaffDashboardIntro } from "./staff-dashboard-intro";
import { StaffDashboardJobPipeline } from "./staff-dashboard-job-pipeline";
import { StaffDashboardQuickLinks } from "./staff-dashboard-quick-links";
import { StaffDashboardRecentJobs } from "./staff-dashboard-recent-jobs";
import { StaffDashboardSampleSnapshot } from "./staff-dashboard-sample-snapshot";
import { StaffDashboardStatsGrid } from "./staff-dashboard-stats-grid";

export default function StaffDashboardHome() {
  const user = useAuthStore((s) => s.user);
  const showAdmin = isStaffAdmin(user);
  const isAnalyst = staffRoleName(user) === "analyst";

  return (
    <div className="space-y-8">
      <StaffDashboardIntro />
      <StaffRoleBanner />
      {showAdmin ? <StaffAdminPromoCard /> : null}
      <StaffDashboardQuickLinks />
      {!isAnalyst ? <StaffDashboardAttentionQueue /> : null}
<<<<<<< HEAD
      <StaffDashboardJobPipeline />
      <StaffDashboardSampleSnapshot />
      <StaffDashboardStatsGrid />
      <StaffDashboardRecentJobs />
=======
      {/* <StaffDashboardJobPipeline />
      <StaffDashboardSampleSnapshot />
      <StaffDashboardStatsGrid />
      <StaffDashboardRecentJobs /> */}
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
    </div>
  );
}
