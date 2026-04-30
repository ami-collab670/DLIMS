import { NotificationsCenter } from "@/features/notifications/notifications-center";

export default function ClientNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          In-app alerts for your account (job updates, finance, and messages from
          staff). Unread count also appears on the bell in the header; this page
          refreshes when you return or change filters.
        </p>
      </div>
      <NotificationsCenter />
    </div>
  );
}
