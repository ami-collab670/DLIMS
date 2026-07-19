import {
  canIntakeSamples,
  canManageJobsAndSamples,
  isReceptionist,
  isStaffAdmin,
} from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

export function StaffDashboardIntro() {
  const user = useAuthStore((s) => s.user);
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "there";
  const roleLabel =
    user?.role_detail?.display_name ||
    user?.role_detail?.role_name?.replace(/_/g, " ") ||
    (user?.is_superuser ? "Superuser" : null);

  const intake = canIntakeSamples(user);
  const manageOps = canManageJobsAndSamples(user);
  const admin = isStaffAdmin(user);
  const receptionist = isReceptionist(user);

  let subtitle =
    "Laboratory information snapshot — job pipeline, analyst workspaces, and quick access to LSIMS areas.";
  let roleHint =
    "Use the sections below to monitor work in progress and open detailed workflows when needed.";
  if (receptionist) {
    subtitle =
      "Reception desk overview — intake queue, finance coordination, and client communication.";
    roleHint =
      "Register jobs and samples, track payment clearance with Finance, and message clients from the sections below.";
  } else if (admin) {
    roleHint +=
      " As an administrator you can manage users, the test catalog, and laboratory records.";
  } else if (intake) {
    roleHint +=
      " Submitted client requests appear in the attention queue until they are acknowledged into the laboratory.";
  } else if (manageOps) {
    roleHint += " You can update jobs, samples, and test assignments from the Laboratory hub.";
  } else if (user && !manageOps) {
    roleHint +=
      " Your assigned analyst work and blind identifiers are available under Laboratory and Analyst.";
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <p className="mt-3 text-sm">
        <span className="font-medium text-foreground">Welcome back, {displayName}.</span>
        {roleLabel ? (
          <span className="text-muted-foreground"> · {roleLabel}</span>
        ) : null}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{roleHint}</p>
    </div>
  );
}
