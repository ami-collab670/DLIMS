import type { AuthUser } from "@/types/auth";

export function getNotificationsPath(
  user: AuthUser,
): "/staff/notifications" | "/client/notifications" {
  return user.user_type === "internal"
    ? "/staff/notifications"
    : "/client/notifications";
}
