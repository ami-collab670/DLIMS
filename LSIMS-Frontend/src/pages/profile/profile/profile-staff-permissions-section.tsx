import { Check } from "lucide-react";

import { getAccessibleStaffAreaLabels } from "@/lib/staff";
import { canAccessUserManagement } from "@/lib/staff";
import {
  canRequestDiscountApproval,
  canIntakeSamples,
  canManageJobsAndSamples,
  canManageTestCatalog,
  isReceptionist,
  staffRoleName,
} from "@/lib/staff";
import type { AuthUser } from "@/types/auth";

type Props = {
  profile: AuthUser;
};

type Capability = {
  label: string;
  enabled: boolean;
};

function buildCapabilities(profile: AuthUser): Capability[] {
  if (isReceptionist(profile)) {
    return [
      { label: "Intake (jobs & samples)", enabled: canIntakeSamples(profile) },
      { label: "Job & sample updates", enabled: canManageJobsAndSamples(profile) },
      { label: "Finance (read-only)", enabled: true },
      { label: "Discount requests", enabled: canRequestDiscountApproval(profile) },
      { label: "Client coordination", enabled: true },
    ].filter((c) => c.enabled);
  }

  const caps: Capability[] = [
    { label: "Test catalog admin", enabled: canManageTestCatalog(profile) },
    { label: "Job & sample updates", enabled: canManageJobsAndSamples(profile) },
    { label: "Intake (jobs & samples)", enabled: canIntakeSamples(profile) },
    { label: "User management", enabled: canAccessUserManagement(profile) },
  ];

  const hasWrite =
    caps.some((c) => c.enabled) ||
    profile.is_superuser;

  if (
    !hasWrite &&
    profile.user_type === "internal"
  ) {
    caps.push({ label: "Read-only / scoped access (per API)", enabled: true });
  }

  return caps.filter((c) => c.enabled);
}

export function ProfileStaffPermissionsSection({ profile }: Props) {
  const roleLabel =
    profile.role_detail?.display_name ??
    staffRoleName(profile)?.replace(/_/g, " ") ??
    (profile.is_superuser ? "Superuser" : "Staff");

  const capabilities = buildCapabilities(profile);
  const areas = getAccessibleStaffAreaLabels(profile);

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="permissions-heading"
    >
      <h3 id="permissions-heading" className="text-sm font-medium">
        Permissions &amp; access
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Effective capabilities and workspace areas for{" "}
        <span className="font-medium text-foreground capitalize">{roleLabel}</span> in
        this app (mirrors frontend route rules).
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Capabilities
          </h4>
          <ul className="mt-2 space-y-1.5">
            {capabilities.map((cap) => (
              <li
                key={cap.label}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {cap.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workspace areas
          </h4>
          {areas.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {areas.map((label) => (
                <li
                  key={label}
                  className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium"
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No workspace areas available.</p>
          )}
        </div>
      </div>
    </section>
  );
}
