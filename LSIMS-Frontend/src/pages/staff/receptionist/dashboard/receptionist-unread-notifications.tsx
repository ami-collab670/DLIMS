import { useQuery } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchUnreadNotificationCount } from "@/features/notifications/api";
import { notificationKeys } from "@/features/notifications/query-keys";

export function ReceptionistUnreadNotifications() {
  const { data: count = 0, isLoading, isError } = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (isError) return null;

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="receptionist-unread-heading"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Bell className="size-4 text-primary" aria-hidden />
        <h3 id="receptionist-unread-heading" className="text-sm font-medium">
          Notifications
        </h3>
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading" />
        ) : (
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
            {count} unread
          </span>
        )}
        <Link
          to="/staff/notifications"
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Open inbox →
        </Link>
      </div>
      {!isLoading && count === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Your inbox is up to date.</p>
      ) : null}
    </section>
  );
}
