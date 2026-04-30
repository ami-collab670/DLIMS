import {
  canIntakeSamples,
  canManageJobsAndSamples,
  canManageTestCatalog,
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

  const caps: string[] = [];
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

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
      <p>
        <span className="font-medium text-foreground">Role: </span>
        <span className="capitalize">{label}</span>
      </p>
      {caps.length ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Capabilities in this app: {caps.join(" · ")}.
        </p>
      ) : null}
    </div>
  );
}
