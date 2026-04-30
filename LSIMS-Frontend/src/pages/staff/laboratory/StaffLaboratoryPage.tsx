import { useEffect, useState } from "react";

import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import { StaffSamplesSection } from "@/pages/staff/samples/staff-samples-section";
import {
  canIntakeSamples,
  canManageJobsAndSamples,
  canManageTestCatalog,
} from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import { StaffAssignmentsSection } from "./assignments/staff-assignments-section";
import type { LaboratoryTabId } from "./constants";
import { StaffCatalogSection } from "./catalog/staff-catalog-section";
import { StaffJobsSection } from "./jobs/staff-jobs-section";
import { LaboratoryTabBar } from "./laboratory-tab-bar";

export default function StaffLaboratoryPage() {
  const user = useAuthStore((s) => s.user);
  const intake = canIntakeSamples(user);
  const manageJobs = canManageJobsAndSamples(user);
  const manageCatalog = canManageTestCatalog(user);
  const showAssignmentsTab = manageJobs;
  const [tab, setTab] = useState<LaboratoryTabId>("jobs");

  useEffect(() => {
    if (!showAssignmentsTab && tab === "assignments") {
      setTab("jobs");
    }
  }, [showAssignmentsTab, tab]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Laboratory</h2>
        <p className="text-sm text-muted-foreground">
          Job orders, samples, test catalog, and assignments — wired to the
          laboratory API. Actions you see match your role.
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
      {tab === "samples" ? (
        <StaffSamplesSection intake={intake} manage={manageJobs} />
      ) : null}
      {tab === "catalog" ? <StaffCatalogSection canWrite={manageCatalog} /> : null}
      {tab === "assignments" && showAssignmentsTab ? (
        <StaffAssignmentsSection manage={manageJobs} />
      ) : null}
    </div>
  );
}
