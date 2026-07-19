import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import { StaffDashboardIntro } from "@/pages/staff/dashboard-home/staff-dashboard-intro";

import { FinanceAwaitingClearanceQueue } from "./finance-awaiting-clearance-queue";
import { FinanceCompliancePreview } from "./finance-compliance-preview";
import { FinanceDiscountTracker } from "./finance-discount-tracker";
import { FinanceFollowUpQueue } from "./finance-follow-up-queue";
import { FinanceHoldQueue } from "./finance-hold-queue";
import { FinanceKpiGrid } from "./finance-dashboard-kpis";
import { FinanceOutstandingInvoicesQueue } from "./finance-outstanding-invoices-queue";
import { FinanceQuickActions } from "./finance-quick-actions";
import { FinanceRecentNotifications } from "./finance-recent-notifications";
import { FinanceRecentlyClearedQueue } from "./finance-recently-cleared-queue";
import { FinanceReportsSnapshot } from "./finance-reports-snapshot";
import { FinanceWaiverReleaseQueue } from "./finance-waiver-release-queue";

export default function FinanceDashboardHome() {
  return (
    <div className="space-y-8">
      <StaffDashboardIntro />
      <StaffRoleBanner />
      <FinanceKpiGrid />
      <FinanceQuickActions />
      <p className="text-xs text-muted-foreground">
        Use client email and phone shown in job details to contact clients outside the app.
        In-app messaging for Finance requires a backend permission update.
      </p>
      <FinanceReportsSnapshot />
      <FinanceRecentNotifications />
      <FinanceAwaitingClearanceQueue />
      <FinanceOutstandingInvoicesQueue />
      <FinanceFollowUpQueue />
      <FinanceWaiverReleaseQueue />
      <FinanceRecentlyClearedQueue />
      <FinanceHoldQueue />
      <FinanceCompliancePreview />
      <FinanceDiscountTracker />
    </div>
  );
}
