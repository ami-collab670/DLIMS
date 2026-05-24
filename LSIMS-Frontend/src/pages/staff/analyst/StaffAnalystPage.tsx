import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import {
  canIntakeSamples,
  canManageJobsAndSamples,
  isStaffAnalyst,
} from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import { StaffAnalystSection } from "./staff-analyst-section";

export default function StaffAnalystPage() {
  const user = useAuthStore((s) => s.user);
  const intake = canIntakeSamples(user);
  const manage = canManageJobsAndSamples(user);
  const analyst = isStaffAnalyst(user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {analyst ? "Assigned to you" : "Analyst"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {analyst ? (
            <>
              Work assigned to your analyst account. Listing is blind (no client identifiers);
              workflow or roster changes go through reception or admin in Laboratory.
            </>
          ) : (
            <>
              Analyst workspace: browse and filter material, register intake (reception), and manage
              assignments and lifecycle fields permitted by the API for your role.
            </>
          )}
        </p>
      </div>

      <StaffRoleBanner />

      <StaffAnalystSection intake={intake} manage={manage} isAnalyst={analyst} />
    </div>
  );
}
