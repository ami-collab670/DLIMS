import type { AuthUser } from "@/types/auth";

/** LSIMS role key from profile (`admin`, `analyst`, …). */
export function staffRoleName(user: AuthUser | null): string | undefined {
  return user?.role_detail?.role_name;
}

function roleName(user: AuthUser | null): string | undefined {
  return staffRoleName(user);
}

<<<<<<< HEAD
/** Lab analyst role — blind read scope & assigned samples bench. */
export function isStaffAnalyst(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  return roleName(user) === "analyst";
}

=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
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

/** Patch jobs, patch/delete samples, manage sample-test links. */
export function canManageJobsAndSamples(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  const r = roleName(user);
  return Boolean(
    user.is_superuser === true || r === "admin" || r === "receptionist",
  );
}

/** Create/edit catalog tests (admin or superuser only per backend). */
export function canManageTestCatalog(user: AuthUser | null): boolean {
  return isStaffAdmin(user);
}
