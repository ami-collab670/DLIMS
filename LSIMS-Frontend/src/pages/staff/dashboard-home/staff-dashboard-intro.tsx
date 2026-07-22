import {
  canIntakeSamples,
  canManageJobsAndSamples,
  isFinance,
  isQcManager,
  isReceptionist,
  isStaffAnalyst,
  isStaffLabTechnician,
  isStaffAdmin,
} from "@/lib/staff";
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
  const finance = isFinance(user);
  const qcManager = isQcManager(user);
  const analyst = isStaffAnalyst(user);
  const labTechnician = isStaffLabTechnician(user);

  let subtitle =
    "Laboratory information snapshot — job pipeline, analyst workspaces, and quick access to LSIMS areas.";
  let roleHint =
    "Use the sections below to monitor work in progress and open detailed workflows when needed.";
  if (receptionist) {
    subtitle =
      "Reception desk overview — intake queue, finance coordination, and client communication.";
    roleHint =
      "Register jobs and samples, track payment clearance with Finance, and message clients from the sections below.";
  } else if (finance) {
    subtitle =
      "Finance desk overview — invoices, payments, clearance queues, and payment compliance.";
    roleHint =
      "Use the queues below to create invoices, record payments, and track discounts. Contact clients and reception via job details; your inbox is read-only.";
  } else if (qcManager) {
    subtitle =
      "Quality control overview — submitted results awaiting review, recent decisions, and department QC metrics.";
    roleHint =
      "Route paid samples to analysts and preparation in your department, then approve or reject submitted results in QC review. Client identity is hidden.";
  } else if (analyst) {
    subtitle =
      "Analyst bench overview — samples assigned to you, draft results, and submissions awaiting QC.";
    roleHint =
      "Enter analysis results on assigned samples, add calibrations inline, and submit to your department QC manager. Only your assigned work is shown.";
  } else if (labTechnician) {
    subtitle =
      "Preparation bench overview — your assigned prep queue and in-progress work.";
    roleHint =
      "Start and complete preparation on records assigned to you or pending records you can claim. Hand off to analysts when prep is done.";
  } else if (admin) {
    roleHint +=
      " As an administrator you can manage users, the test catalog, and laboratory records.";
  } else if (intake) {
    roleHint +=
      " Submitted client requests appear in the attention queue until they are acknowledged into the laboratory.";
  } else if (manageOps) {
    roleHint += " You can update jobs, samples, and test assignments from the Laboratory hub.";
  } else if (user && !manageOps && !analyst && !labTechnician) {
    roleHint +=
      " Your assigned work and blind identifiers are available from the areas in your sidebar.";
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
