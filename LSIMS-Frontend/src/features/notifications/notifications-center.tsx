import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createNotification,
  deleteNotification,
  fetchNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markAllNotificationsUnread,
  patchNotificationRead,
} from "@/features/notifications/api";
import { notificationKeys } from "@/features/notifications/query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { canManageJobsAndSamples } from "@/lib/staff-permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { NotificationKind, NotificationRecord } from "@/types/notification";

const KIND_OPTIONS: { value: NotificationKind | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "info", label: "Info" },
  { value: "alert", label: "Alert" },
  { value: "job", label: "Job" },
  { value: "message", label: "Message" },
  { value: "system", label: "System" },
];

const PAGE_SIZE = 20;

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function NotificationListItem({
  notification,
  onMarkRead,
  onDelete,
  markReadPending,
  deletePending,
}: {
  notification: NotificationRecord;
  onMarkRead: (read: boolean) => void;
  onDelete: () => void;
  markReadPending: boolean;
  deletePending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const detailQuery = useQuery({
    queryKey: notificationKeys.detail(notification.id),
    queryFn: () => fetchNotification(notification.id),
    enabled: expanded,
    staleTime: 0,
  });
  const row = detailQuery.data ?? notification;

  return (
    <li
      className={cn(
        "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between",
        !row.is_read && "bg-primary/5",
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {row.kind}
          </span>
          {!row.is_read ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
              Unread
            </span>
          ) : null}
        </div>
        <p className="font-medium leading-snug">{row.title}</p>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {row.body}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatWhen(row.created_at)}
        </p>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded
            ? detailQuery.isFetching
              ? "Refreshing…"
              : "Hide detail"
            : "Load full detail"}
        </Button>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={markReadPending}
          onClick={() => onMarkRead(!row.is_read)}
        >
          {row.is_read ? "Mark unread" : "Mark read"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={deletePending}
          onClick={onDelete}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </Button>
      </div>
    </li>
  );
}

export function NotificationsCenter({
  showStaffSendForm = false,
}: {
  showStaffSendForm?: boolean;
}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canSend = showStaffSendForm && canManageJobsAndSamples(user);

  const [page, setPage] = useState(1);
  const [unreadFilter, setUnreadFilter] = useState<"" | "0" | "1">("");
  const [kindFilter, setKindFilter] = useState<NotificationKind | "">("");

  const listParams = useMemo(
    () => ({
      page,
      unread: unreadFilter === "" ? undefined : unreadFilter,
      kind: kindFilter === "" ? undefined : kindFilter,
    }),
    [page, unreadFilter, kindFilter],
  );

  const listQuery = useQuery({
    queryKey: notificationKeys.list(listParams),
    queryFn: () => fetchNotifications(listParams),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };

  const markReadMut = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      patchNotificationRead(id, read),
    onSuccess: () => {
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      toast.success("Notification removed.");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const markAllReadMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (n) => {
      toast.success(
        n === 0 ? "Nothing to mark." : `Marked ${n} notification(s) as read.`,
      );
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const markAllUnreadMut = useMutation({
    mutationFn: markAllNotificationsUnread,
    onSuccess: (n) => {
      toast.success(
        n === 0 ? "No read notifications." : `Marked ${n} as unread.`,
      );
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const [sendRecipient, setSendRecipient] = useState("");
  const [sendTitle, setSendTitle] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendKind, setSendKind] = useState<NotificationKind>("info");

  const sendMut = useMutation({
    mutationFn: () =>
      createNotification({
        recipient: sendRecipient.trim(),
        title: sendTitle.trim(),
        body: sendBody.trim(),
        kind: sendKind,
      }),
    onSuccess: () => {
      toast.success("Notification sent.");
      setSendRecipient("");
      setSendTitle("");
      setSendBody("");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const totalPages = listQuery.data
    ? Math.max(1, Math.ceil(listQuery.data.count / PAGE_SIZE))
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="notif-unread-filter">Status</Label>
          <select
            id="notif-unread-filter"
            className={cn(
              "flex h-9 rounded-md border border-input bg-transparent px-3 text-sm",
            )}
            value={unreadFilter}
            onChange={(e) => {
              setUnreadFilter(e.target.value as "" | "0" | "1");
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="1">Unread only</option>
            <option value="0">Read only</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="notif-kind-filter">Type</Label>
          <select
            id="notif-kind-filter"
            className={cn(
              "flex h-9 rounded-md border border-input bg-transparent px-3 text-sm",
            )}
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value as NotificationKind | "");
              setPage(1);
            }}
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markAllReadMut.isPending}
            onClick={() => markAllReadMut.mutate()}
          >
            Mark all read
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markAllUnreadMut.isPending}
            onClick={() => markAllUnreadMut.mutate()}
          >
            Mark all unread
          </Button>
        </div>
      </div>

      {canSend ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium">Send notification</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Deliver an in-app message to a user by their account email address.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="send-recipient">Recipient email</Label>
              <Input
                id="send-recipient"
                className="font-mono text-xs"
                type="email"
                placeholder="user@example.com"
                value={sendRecipient}
                onChange={(e) => setSendRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="send-kind">Type</Label>
              <select
                id="send-kind"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={sendKind}
                onChange={(e) =>
                  setSendKind(e.target.value as NotificationKind)
                }
              >
                {KIND_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="send-title">Title</Label>
              <Input
                id="send-title"
                value={sendTitle}
                onChange={(e) => setSendTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="send-body">Message</Label>
              <Textarea
                id="send-body"
                rows={3}
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            className="mt-3"
            disabled={
              sendMut.isPending ||
              !sendRecipient.trim() ||
              !sendTitle.trim() ||
              !sendBody.trim()
            }
            onClick={() => sendMut.mutate()}
          >
            Send
          </Button>
        </section>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {listQuery.isLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : listQuery.isError ? (
          <p className="p-6 text-sm text-destructive">
            {getApiErrorMessage(listQuery.error)}
          </p>
        ) : !listQuery.data?.results.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No notifications match your filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {listQuery.data.results.map((n: NotificationRecord) => (
              <NotificationListItem
                key={n.id}
                notification={n}
                markReadPending={markReadMut.isPending}
                deletePending={deleteMut.isPending}
                onMarkRead={(read) => markReadMut.mutate({ id: n.id, read })}
                onDelete={() => {
                  if (
                    !window.confirm(
                      "Remove this notification from your inbox?",
                    )
                  ) {
                    return;
                  }
                  deleteMut.mutate(n.id);
                }}
              />
            ))}
          </ul>
        )}

        {listQuery.data && listQuery.data.count > PAGE_SIZE ? (
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({listQuery.data.count} total)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
