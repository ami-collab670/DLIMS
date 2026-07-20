import {
  canIntakeSamples,
  canManageJobsAndSamples,
  canManageTestCatalog,
  isFinance,
  isQcManager,
  isReceptionist,
  staffRoleName,
} from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Explains effective laboratory permissions for the signed-in staff member (mirrors backend rules).
 */
export function StaffRoleBanner() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const label =
    user.role_detail?.display_name ??
    staffRoleName(user)?.replace(/_/g, " ") ??
    (user.is_superuser ? "Superuser" : "Staff");

  const receptionist = isReceptionist(user);
  const finance = isFinance(user);
  const qcManager = isQcManager(user);

  const caps: string[] = [];
  if (finance) {
    caps.push("invoice create/update");
    caps.push("payment recording");
    caps.push("discount requests (director review)");
    caps.push("read-only notifications inbox");
  } else if (receptionist) {
    caps.push("intake (jobs & samples)");
    caps.push("job & sample updates");
    caps.push("finance coordination (read-only)");
  } else if (qcManager) {
    caps.push("QC review (department-scoped)");
  } else {
    if (canManageTestCatalog(user)) caps.push("catalog admin");
    if (canManageJobsAndSamples(user)) caps.push("job & sample updates");
    if (canIntakeSamples(user)) caps.push("intake (jobs & samples)");
    if (
      !canManageJobsAndSamples(user) &&
      !canIntakeSamples(user) &&
      user.user_type === "internal"
    ) {
      caps.push("read-only or scoped data (per API)");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
      <p>
        <span className="font-medium text-foreground">Role: </span>
        <span className="capitalize">{label}</span>
      </p>
      {finance ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Finance desk — invoicing, payments &amp; discount requests
        </p>
      ) : null}
      {receptionist ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Reception desk — sample intake &amp; client coordination
        </p>
      ) : null}
      {qcManager ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Quality control — approve or reject submitted analysis results in your department
        </p>
      ) : null}
      {caps.length ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Capabilities in this app: {caps.join(" · ")}.
        </p>
      ) : null}
    </div>
  );
}
