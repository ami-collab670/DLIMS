import { useEffect, useState } from "react";

import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
<<<<<<< HEAD
import { StaffAnalystSection } from "@/pages/staff/analyst/staff-analyst-section";
import {
  canIntakeSamples,
  canManageJobsAndSamples,
  isStaffAnalyst,
=======
import { StaffSamplesSection } from "@/pages/staff/samples/staff-samples-section";
import {
  canIntakeSamples,
  canManageJobsAndSamples,
  canManageTestCatalog,
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
} from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import { StaffAssignmentsSection } from "./assignments/staff-assignments-section";
import type { LaboratoryTabId } from "./constants";
<<<<<<< HEAD
=======
import { StaffCatalogSection } from "./catalog/staff-catalog-section";
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import { StaffJobsSection } from "./jobs/staff-jobs-section";
import { LaboratoryTabBar } from "./laboratory-tab-bar";

export default function StaffLaboratoryPage() {
  const user = useAuthStore((s) => s.user);
  const intake = canIntakeSamples(user);
  const manageJobs = canManageJobsAndSamples(user);
<<<<<<< HEAD
=======
  const manageCatalog = canManageTestCatalog(user);
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
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
<<<<<<< HEAD
          Job orders, analyst routing, and test assignments — wired to the laboratory API. Manage
          the test catalog from the sidebar link <strong>Test catalog</strong>. Actions match your
          role.
=======
          Job orders, samples, test catalog, and assignments — wired to the
          laboratory API. Actions you see match your role.
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
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
<<<<<<< HEAD
      {tab === "analyst" ? (
        <StaffAnalystSection
          intake={intake}
          manage={manageJobs}
          isAnalyst={isStaffAnalyst(user)}
        />
      ) : null}
=======
      {tab === "samples" ? (
        <StaffSamplesSection intake={intake} manage={manageJobs} />
      ) : null}
      {tab === "catalog" ? <StaffCatalogSection canWrite={manageCatalog} /> : null}
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
      {tab === "assignments" && showAssignmentsTab ? (
        <StaffAssignmentsSection manage={manageJobs} />
      ) : null}
    </div>
  );
}
