import type { NotificationListParams } from "./api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (p: NotificationListParams) => ["notifications", "list", p] as const,
<<<<<<< HEAD
  detail: (id: string) => ["notifications", "detail", id] as const,
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
  unreadCount: ["notifications", "unread-count"] as const,
};
