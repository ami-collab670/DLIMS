import { useQuery } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchNotifications } from "@/features/notifications/api";
import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function FinanceRecentNotifications() {
  const { data, isLoading, isError } = useQuery({
    queryKey: dashboardKeys.financeRecentNotifications,
    queryFn: () => fetchNotifications({ page: 1 }),
    staleTime: 30_000,
  });

  const preview = (data?.results ?? []).slice(0, 5);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (isError) return null;

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="finance-notifications-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Bell className="size-4 text-primary" aria-hidden />
        <h3 id="finance-notifications-heading" className="text-sm font-medium">
          Recent inbox
        </h3>
        <Link
          to="/staff/notifications"
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Open inbox →
        </Link>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Read-only for Finance — contact clients and reception directly for outbound messages.
      </p>

      {!preview.length ? (
        <p className="text-sm text-muted-foreground">No notifications in your inbox yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {preview.map((n) => (
            <li key={n.id} className="space-y-1 px-3 py-2">
              <p className="text-sm font-medium leading-snug">{n.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
              <p className="text-xs text-muted-foreground">{formatWhen(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
