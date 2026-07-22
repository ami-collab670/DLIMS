import type { AuthUser } from "@/types/auth";

/** LSIMS role key from profile (`admin`, `analyst`, …). */
export function staffRoleName(user: AuthUser | null): string | undefined {
  return user?.role_detail?.role_name;
}

function roleName(user: AuthUser | null): string | undefined {
  return staffRoleName(user);
}

/** Lab analyst role — blind read scope & assigned samples bench. */
export function isStaffAnalyst(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return roleName(user) === "analyst";
}

/** Lab preparation technician — prep bench workflows. */
export function isStaffLabTechnician(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return roleName(user) === "lab_technician";
}

/** Department manager / QC manager — catalog writes for own department. */
export function isQcManager(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return roleName(user) === "qc_manager";
}

/** Reception desk — sample intake and client coordination. */
export function isReceptionist(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return roleName(user) === "receptionist";
}

/** Finance role — invoices and discount requests. */
export function isFinance(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return roleName(user) === "finance";
}

/** Lab director — discount approval reviews. */
export function isLabDirector(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return roleName(user) === "lab_director";
}

/** LSIMS admin role or Django superuser — user management, test catalog writes. */
export function isStaffAdmin(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return Boolean(user.is_superuser === true || roleName(user) === "admin");
}

/** Receptionist intake: create jobs & samples (Django superuser included). */
export function canIntakeSamples(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return Boolean(
    user.is_superuser || roleName(user) === "receptionist",
  );
}

/** Patch jobs (description/priority only), patch/delete samples, manage sample-test links. */
export function canManageJobsAndSamples(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  const r = roleName(user);
  return Boolean(
    user.is_superuser === true || r === "admin" || r === "receptionist",
  );
}

/** Create/edit catalog tests (admin, superuser, or department qc_manager). */
export function canManageTestCatalog(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return Boolean(
    user.is_superuser === true ||
      roleName(user) === "admin" ||
      roleName(user) === "qc_manager",
  );
}

/** Request a discount/waiver (finance, reception, admin). */
export function canRequestDiscountApproval(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  const r = roleName(user);
  return Boolean(
    user.is_superuser === true ||
      r === "admin" ||
      r === "finance" ||
      r === "receptionist",
  );
}

/** Approve or reject discount requests (lab director or admin). */
export function canApproveDiscountApproval(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return Boolean(
    user.is_superuser === true ||
      roleName(user) === "admin" ||
      roleName(user) === "lab_director",
  );
}

/** Assign an analyst to a sample (admin, reception, department manager). */
export function canAssignSampleAnalyst(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  const r = roleName(user);
  return Boolean(
    user.is_superuser === true ||
      r === "admin" ||
      r === "receptionist" ||
      r === "qc_manager",
  );
}

/** Create preparation records (admin, reception, department manager). */
export function canCreatePreparationRecord(user: AuthUser | null): boolean {
  return canAssignSampleAnalyst(user);
}

/** Patch sample metadata (name, weight, notes) — admin/reception only. */
export function canPatchSampleDetails(user: AuthUser | null): boolean {
  return canManageJobsAndSamples(user);
}

/** Resolve/reject/edit complaints — not department managers. */
export function canCloseComplaints(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  const r = roleName(user);
  return Boolean(
    user.is_superuser === true ||
      r === "admin" ||
      r === "receptionist" ||
      r === "lab_director",
  );
}

/** Read-only department team roster on dashboard. */
export function canViewDepartmentTeamRoster(user: AuthUser | null): boolean {
  return isQcManager(user) && Boolean(user?.department);
}
