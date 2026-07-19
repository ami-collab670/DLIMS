import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { useBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { useTrackedTabs } from "@/hooks/use-tracked-tabs";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import { ReceptionistLaboratorySection } from "@/pages/staff/receptionist/laboratory/ReceptionistLaboratorySection";
import {
  canIntakeSamples,
  canManageJobsAndSamples,
  isReceptionist,
  staffRoleName,
} from "@/lib/staff-permissions";
import { shouldHideClientSampleNames } from "@/lib/sample-reference-display";
import { useAuthStore } from "@/stores/auth-store";
import { StaffAnalystSection } from "@/pages/staff/analyst/staff-analyst-section";

import type { LaboratoryTabId } from "./constants";
import { StaffAssignmentsSection } from "./assignments/staff-assignments-section";
import { StaffJobsSection } from "./jobs/staff-jobs-section";
import { LaboratoryTabBar } from "./laboratory-tab-bar";

const LABORATORY_TAB_LABELS: Record<LaboratoryTabId, string> = {
  jobs: "Job orders",
  analyst: "Analyst",
  assignments: "Test assignments",
};

function parseLaboratoryTabParam(value: string | null): LaboratoryTabId | null {
  if (value === "jobs" || value === "analyst" || value === "assignments") {
    return value;
  }
  return null;
}

export default function StaffLaboratoryPage() {
  const user = useAuthStore((s) => s.user);
  const receptionist = isReceptionist(user);

  const intake = canIntakeSamples(user);
  const manageJobs = canManageJobsAndSamples(user);

  const showAssignmentsTab = manageJobs;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const parsedTab = parseLaboratoryTabParam(tabParam);
  const initialTab: LaboratoryTabId = parsedTab ?? "jobs";

  const [tab, setTab] = useTrackedTabs<LaboratoryTabId>(initialTab);

  const handleTabChange = useCallback(
    (next: LaboratoryTabId) => {
      setTab(next, { skipHistory: true });
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("tab", next);
          return params;
        },
        { replace: true },
      );
    },
    [setTab, setSearchParams],
  );

  useEffect(() => {
    if (!receptionist) return;
    if (tabParam === "analyst" || tabParam === "assignments") {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.delete("tab");
          return params;
        },
        { replace: true },
      );
    }
  }, [receptionist, setSearchParams, tabParam]);

  useEffect(() => {
    if (receptionist) return;
    if (parsedTab) {
      setTab(parsedTab, { skipHistory: true });
    }
  }, [parsedTab, receptionist, setTab]);

  useEffect(() => {
    if (receptionist) return;
    if (!showAssignmentsTab && tab === "assignments") {
      setTab("jobs", { skipHistory: true });
    }
  }, [receptionist, showAssignmentsTab, setTab, tab]);

  const tabLabels = LABORATORY_TAB_LABELS;
  const tabSegments = useMemo(
    () => (receptionist ? [] : [{ label: tabLabels[tab] }]),
    [receptionist, tab, tabLabels],
  );
  useBreadcrumbSegments(tabSegments, "laboratory-tab");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {receptionist ? "Sample intake" : "Laboratory"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {receptionist ? (
            <>
              Register job orders and samples from one desk view. Select a job to register
              samples, assign tests, and check finance clearance — finance edits stay read-only
              here.
            </>
          ) : (
            <>
              Job orders, analyst routing, and test assignments — wired to the laboratory API.
              Manage the test catalog from the sidebar link <strong>Test catalog</strong>. Actions
              match your role.
            </>
          )}
        </p>
      </div>

      <StaffRoleBanner />

      {receptionist ? (
        <ReceptionistLaboratorySection />
      ) : (
        <>
          <LaboratoryTabBar
            tab={tab}
            onTabChange={handleTabChange}
            showAssignmentsTab={showAssignmentsTab}
            analystTabLabel="Analyst"
          />

          {tab === "jobs" ? (
            <StaffJobsSection
              intake={intake}
              manageJobs={manageJobs}
              financeReadOnly={false}
            />
          ) : null}
          {tab === "analyst" ? (
            <StaffAnalystSection
              intake={intake}
              manage={manageJobs}
              isAnalyst={staffRoleName(user) === "analyst"}
              hideClientSampleNames={shouldHideClientSampleNames(user)}
            />
          ) : null}
          {tab === "assignments" && showAssignmentsTab ? (
            <StaffAssignmentsSection manage={manageJobs} />
          ) : null}
        </>
      )}
    </div>
  );
}
