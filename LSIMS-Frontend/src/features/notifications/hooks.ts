import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createNotification,
  deleteNotification,
  fetchNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markAllNotificationsUnread,
  patchNotificationRead,
  type CreateNotificationBody,
  type NotificationListParams,
} from "@/features/notifications/api";
import { notificationKeys } from "@/features/notifications/query-keys";
import { getApiErrorMessage } from "@/lib/api";
import type { DrfPaginated } from "@/types/laboratory";
import type { NotificationRecord } from "@/types/notification";

const DEFAULT_LIST_STALE_MS = 15_000;
const DEFAULT_UNREAD_STALE_MS = 10_000;

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };
}

type NotificationsQueryOptions = Omit<
  UseQueryOptions<DrfPaginated<NotificationRecord>>,
  "queryKey" | "queryFn"
>;

export function useNotifications(
  params: NotificationListParams = {},
  options?: NotificationsQueryOptions,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    staleTime: DEFAULT_LIST_STALE_MS,
    ...options,
  });
}

type UnreadCountQueryOptions = Omit<
  UseQueryOptions<number>,
  "queryKey" | "queryFn"
>;

export function useUnreadCount(options?: UnreadCountQueryOptions) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: fetchUnreadNotificationCount,
    staleTime: DEFAULT_UNREAD_STALE_MS,
    ...options,
  });
}

export function useNotificationDetail(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => fetchNotification(id),
    enabled: options?.enabled ?? false,
    staleTime: 0,
  });
}

export function useMarkRead() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      patchNotificationRead(id, read),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      toast.success("Notification removed.");
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useMarkAllNotificationsRead(options?: {
  emptyMessage?: string;
  successMessage?: (count: number) => string;
}) {
  const invalidate = useInvalidateNotifications();
  const emptyMessage = options?.emptyMessage ?? "Nothing to mark.";
  const successMessage =
    options?.successMessage ??
    ((count: number) => `Marked ${count} notification(s) as read.`);

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (count) => {
      toast.success(count === 0 ? emptyMessage : successMessage(count));
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useMarkAllNotificationsUnread() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: markAllNotificationsUnread,
    onSuccess: (count) => {
      toast.success(
        count === 0 ? "No read notifications." : `Marked ${count} as unread.`,
      );
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCreateNotification(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: (body: CreateNotificationBody) => createNotification(body),
    onSuccess: () => {
      toast.success("Notification sent.");
      options?.onSuccess?.();
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
