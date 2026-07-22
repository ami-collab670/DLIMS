import type { NotificationKind } from "@/types/notification";

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  info: "Info",
  alert: "Alert",
  job: "Job",
  message: "Message",
  system: "System",
};
