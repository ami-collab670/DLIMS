import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import {
  canIntakeSamples,
  canManageJobsAndSamples,
} from "@/lib/staff";
import { useAuthStore } from "@/stores/auth-store";

import { StaffSamplesSection } from "./staff-samples-section";

export default function StaffSamplesPage() {
  const user = useAuthStore((s) => s.user);
  const intake = canIntakeSamples(user);
  const manage = canManageJobsAndSamples(user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Samples</h2>
        <p className="text-sm text-muted-foreground">
          Browse and filter laboratory samples, register intake (receptionist), and manage
          assignments, catalog links, and lifecycle fields allowed by the API for your role.
        </p>
      </div>

      <StaffRoleBanner />

      <StaffSamplesSection intake={intake} manage={manage} />
    </div>
  );
}
