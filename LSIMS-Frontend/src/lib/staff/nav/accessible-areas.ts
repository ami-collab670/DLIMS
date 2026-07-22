import type { AuthUser } from "@/types/auth";

import { getStaffNavRouteKeys, type StaffRouteKey } from "../route-access";
import { getStaffNavItemLabel } from "./item-label";

const PROFILE_AREA_KEYS = new Set<StaffRouteKey>(["profile", "settings"]);

/** Workspace area labels this user can access (excludes profile/settings). */
export function getAccessibleStaffAreaLabels(user: AuthUser | null): string[] {
  return getStaffNavRouteKeys(user)
    .filter((key) => !PROFILE_AREA_KEYS.has(key))
    .map((key) => getStaffNavItemLabel(key, user));
}
