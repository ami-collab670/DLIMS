import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications/hooks";
import { getNotificationsPath } from "@/lib/routing";
import { cn } from "@/lib/ui";
import { useAuthStore } from "@/stores/auth-store";
import type { NotificationRecord } from "@/types/notification";

const POLL_MS = 25_000;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function NotificationBell({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadQuery = useUnreadCount({
    enabled: Boolean(user),
    refetchInterval: POLL_MS,
  });

  const recentQuery = useNotifications(
    { page: 1 },
    {
      enabled: Boolean(user) && open,
      staleTime: 5_000,
    },
  );

  const markReadMut = useMarkRead();
  const markAllMut = useMarkAllNotificationsRead({
    emptyMessage: "No unread notifications.",
    successMessage: (n) => `Marked ${n} as read.`,
  });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  const count = unreadQuery.data ?? 0;
  const items: NotificationRecord[] = recentQuery.data?.results ?? [];
  const fullPath = getNotificationsPath(user);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative shrink-0"
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-5" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="text-sm font-medium">Notifications</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              disabled={count === 0 || markAllMut.isPending}
              onClick={() => markAllMut.mutate()}
            >
              Mark all read
            </Button>
          </div>

          <div className="max-h-[min(60vh,320px)] overflow-y-auto">
            {recentQuery.isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.slice(0, 8).map((n) => (
                  <li key={n.id} className="px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            !n.is_read && "text-foreground",
                            n.is_read && "text-muted-foreground",
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatTime(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 text-xs"
                          disabled={markReadMut.isPending}
                          onClick={() =>
                            markReadMut.mutate({ id: n.id, read: true })
                          }
                        >
                          Read
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-3 py-2">
            <Button variant="secondary" size="sm" className="w-full" asChild>
              <Link to={fullPath} onClick={() => setOpen(false)}>
                View all and manage
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
