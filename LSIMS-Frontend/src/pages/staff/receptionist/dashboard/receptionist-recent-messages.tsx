import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
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

export function ReceptionistRecentMessages() {
  const { data, isLoading, isError } = useQuery({
    queryKey: dashboardKeys.receptionistRecentMessages,
    queryFn: () => fetchNotifications({ page: 1, kind: "message" }),
    staleTime: 30_000,
  });

  const messages = data?.results ?? [];
  const preview = messages.slice(0, 5);

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
      aria-labelledby="receptionist-messages-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MessageSquare className="size-4 text-primary" aria-hidden />
        <h3 id="receptionist-messages-heading" className="text-sm font-medium">
          Recent client messages
        </h3>
        <Link
          to="/staff/notifications"
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Notifications →
        </Link>
      </div>

      {!preview.length ? (
        <p className="text-sm text-muted-foreground">
          No message notifications in your inbox yet.
        </p>
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
