import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import { canManageTestCatalog } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import { StaffCatalogSection } from "./staff-catalog-section";

export default function StaffCatalogPage() {
  const user = useAuthStore((s) => s.user);
  const canWrite = canManageTestCatalog(user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Test catalog</h2>
        <p className="text-sm text-muted-foreground">
          Billable and analytical offerings from{" "}
          <code className="rounded bg-muted px-1">GET /api/laboratory/tests/</code>. Administrators
          and superusers can create and edit catalog rows; everyone with access to this workspace
          can browse and filter.
        </p>
      </div>

      <StaffRoleBanner />

      <StaffCatalogSection canWrite={canWrite} />
    </div>
  );
}
