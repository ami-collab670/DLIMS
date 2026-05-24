export type NotificationKind =
  | "info"
  | "alert"
  | "job"
  | "message"
  | "system";

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  metadata: Record<string, unknown>;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
};
