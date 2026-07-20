import { useQuery } from "@tanstack/react-query";

import { isQcManager } from "@/lib/staff-permissions";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { fetchDepartmentJobIds } from "@/pages/staff/qc-manager/shared/department-scope-utils";
import { useAuthStore } from "@/stores/auth-store";

import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";
import { StaffCompliancePriorityAlerts } from "./staff-compliance-priority-alerts";
import { StaffComplaintsSection } from "./staff-complaints-section";

export default function StaffCompliancePage() {
  const user = useAuthStore((s) => s.user);
  const qcManager = isQcManager(user);

  const { data: departmentJobIds } = useQuery({
    queryKey: dashboardKeys.qcManagerJobIds,
    queryFn: fetchDepartmentJobIds,
    enabled: qcManager,
    staleTime: 120_000,
  });

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Documents &amp; compliance">
        <p>
          Track client complaints, investigations, and resolutions. Operational
          traceability for jobs also uses status notes and role holds elsewhere
          in LSIMS.
        </p>
        {qcManager ? (
          <p className="mt-2 text-sm text-muted-foreground">
            As department manager, complaints and priority alerts are limited to jobs in your
            department. Review lab quality issues read-only; closing complaints requires Lab
            Director, Reception, or Admin. Client identity is not shown.
          </p>
        ) : null}
      </LimsPageIntro>

      <StaffRoleBanner />

      <StaffCompliancePriorityAlerts departmentJobIds={departmentJobIds} />

      <StaffComplaintsSection
        departmentJobIds={departmentJobIds}
        readOnlyActions={qcManager}
      />
    </div>
  );
}
