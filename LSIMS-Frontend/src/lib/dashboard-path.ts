import type { AuthUser } from "@/types/auth";

export function getDashboardPath(user: AuthUser): "/staff" | "/client" {
  return user.user_type === "internal" ? "/staff" : "/client";
}
