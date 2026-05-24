import { apiClient } from "@/api/client";
import type { DrfPaginated } from "@/types/laboratory";
import type { NotificationKind, NotificationRecord } from "@/types/notification";

const BASE = "/api/notifications/inbox";

export type NotificationListParams = {
  page?: number;
  /** `1` = unread only, `0` = read only, omit = all */
  unread?: "0" | "1";
  kind?: NotificationKind;
};

export async function fetchNotifications(
  params: NotificationListParams = {},
): Promise<DrfPaginated<NotificationRecord>> {
  const { data } = await apiClient.get<DrfPaginated<NotificationRecord>>(BASE, {
    params: {
      page: params.page,
      unread: params.unread,
      kind: params.kind,
    },
  });
  return data;
}

<<<<<<< HEAD
export async function fetchNotification(id: string): Promise<NotificationRecord> {
  const { data } = await apiClient.get<NotificationRecord>(`${BASE}/${id}/`);
  return data;
}

=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>(
    `${BASE}/unread-count/`,
  );
  return data.count;
}

export async function patchNotificationRead(
  id: string,
  read: boolean,
): Promise<NotificationRecord> {
  const { data } = await apiClient.patch<NotificationRecord>(`${BASE}/${id}/`, {
    read,
  });
  return data;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await apiClient.post<{ updated: number }>(
    `${BASE}/mark-all-read/`,
  );
  return data.updated;
}

export async function markAllNotificationsUnread(): Promise<number> {
  const { data } = await apiClient.post<{ updated: number }>(
    `${BASE}/mark-all-unread/`,
  );
  return data.updated;
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}/`);
}

export type CreateNotificationBody = {
  /** Recipient account email (API accepts legacy user UUID as well). */
  recipient: string;
  title: string;
  body: string;
  kind?: NotificationKind;
  metadata?: Record<string, unknown>;
};

export async function createNotification(
  body: CreateNotificationBody,
): Promise<NotificationRecord> {
  const { data } = await apiClient.post<NotificationRecord>(BASE, body);
  return data;
}
