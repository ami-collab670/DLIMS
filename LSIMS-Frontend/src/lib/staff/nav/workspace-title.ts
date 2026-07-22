import type { AuthUser } from "@/types/auth";

import {
  isFinance,
  isLabDirector,
  isQcManager,
  isReceptionist,
  isStaffAdmin,
  isStaffAnalyst,
  isStaffLabTechnician,
  staffRoleName,
} from "../permissions";

/** Main header title for the staff workspace shell. */
export function getStaffWorkspaceTitle(user: AuthUser | null): string {
  if (isReceptionist(user)) return "Receptionist dashboard";
  if (isFinance(user)) return "Finance desk";
  if (isQcManager(user)) return "Quality control";
  if (isStaffAnalyst(user)) return "Analyst bench";
  if (isStaffLabTechnician(user)) return "Preparation bench";
  if (staffRoleName(user) === "auditor") return "Compliance audit";
  if (isLabDirector(user)) return "Laboratory director";
  if (isStaffAdmin(user)) return "Admin workspace";
  return "Staff workspace";
}

/** Role label shown in the staff header (right side). */
export function getStaffRoleStrip(user: AuthUser | null): string | null {
  if (!user) return null;
  return (
    user.role_detail?.display_name ??
    staffRoleName(user)?.replace(/_/g, " ") ??
    (user.is_superuser ? "Superuser" : null)
  );
}
