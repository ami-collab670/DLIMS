import type { NotificationListParams } from "./api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (p: NotificationListParams) => ["notifications", "list", p] as const,
  detail: (id: string) => ["notifications", "detail", id] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};
