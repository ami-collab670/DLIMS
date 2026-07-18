import { useEffect, useMemo } from "react";

import { useBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { useTrackedTabs } from "@/hooks/use-tracked-tabs";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import { StaffAnalystSection } from "@/pages/staff/analyst/staff-analyst-section";
import {
  canIntakeSamples,
  canManageJobsAndSamples,
  isStaffAnalyst,
} from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import type { LaboratoryTabId } from "./constants";
import { StaffAssignmentsSection } from "./assignments/staff-assignments-section";
import { StaffJobsSection } from "./jobs/staff-jobs-section";
import { LaboratoryTabBar } from "./laboratory-tab-bar";

const LABORATORY_TAB_LABELS: Record<LaboratoryTabId, string> = {
  jobs: "Job orders",
  analyst: "Analyst",
  assignments: "Test assignments",
};

export default function StaffLaboratoryPage() {
  const user = useAuthStore((s) => s.user);

  const intake = canIntakeSamples(user);
  const manageJobs = canManageJobsAndSamples(user);

  const showAssignmentsTab = manageJobs;
  const [tab, setTab] = useTrackedTabs<LaboratoryTabId>("jobs");

  useEffect(() => {
    if (!showAssignmentsTab && tab === "assignments") {
      setTab("jobs", { skipHistory: true });
    }
  }, [showAssignmentsTab, setTab, tab]);

  const tabSegments = useMemo(
    () => [{ label: LABORATORY_TAB_LABELS[tab] }],
    [tab],
  );
  useBreadcrumbSegments(tabSegments, "laboratory-tab");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Laboratory</h2>
        <p className="text-sm text-muted-foreground">
          Job orders, analyst routing, and test assignments — wired to the laboratory API. Manage
          the test catalog from the sidebar link <strong>Test catalog</strong>. Actions match your
          role.
        </p>
      </div>

      <StaffRoleBanner />

      <LaboratoryTabBar
        tab={tab}
        onTabChange={setTab}
        showAssignmentsTab={showAssignmentsTab}
      />

      {tab === "jobs" ? (
        <StaffJobsSection intake={intake} manageJobs={manageJobs} />
      ) : null}
      {tab === "analyst" ? (
        <StaffAnalystSection
          intake={intake}
          manage={manageJobs}
          isAnalyst={isStaffAnalyst(user)}
        />
      ) : null}
      {tab === "assignments" && showAssignmentsTab ? (
        <StaffAssignmentsSection manage={manageJobs} />
      ) : null}
    </div>
  );
}
