import type { AuthUser } from "@/types/auth";

import {
  isFinance,
  isQcManager,
  isReceptionist,
  isStaffAnalyst,
  isStaffLabTechnician,
} from "../permissions";
import type { StaffRouteKey } from "../route-access";
import { STAFF_ROUTE_LABELS } from "./labels";

/** Sidebar / nav label — may vary by role (analyst bench wording). */
export function getStaffNavItemLabel(
  routeKey: StaffRouteKey,
  user: AuthUser | null,
): string {
  if (routeKey === "analyst" && isStaffAnalyst(user)) {
    return "My samples";
  }
  if (routeKey === "prep" && isStaffLabTechnician(user)) {
    return "Preparation bench";
  }
  if (routeKey === "dashboard" && isStaffAnalyst(user)) {
    return "Analyst dashboard";
  }
  if (routeKey === "dashboard" && isStaffLabTechnician(user)) {
    return "Prep dashboard";
  }
  if (routeKey === "laboratory" && isReceptionist(user)) {
    return "Sample intake";
  }
  if (routeKey === "laboratory" && isQcManager(user)) {
    return "Route samples";
  }
  if (routeKey === "dashboard" && isFinance(user)) {
    return "Finance desk";
  }
  if (routeKey === "dashboard" && isQcManager(user)) {
    return "QC dashboard";
  }
  if (routeKey === "qc" && isQcManager(user)) {
    return "QC review";
  }
  if (routeKey === "finance" && isFinance(user)) {
    return "Invoices & payments";
  }
  return STAFF_ROUTE_LABELS[routeKey];
}
