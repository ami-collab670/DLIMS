import { NotificationsCenter } from "@/features/notifications/notifications-center";

import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

export default function StaffNotificationsPage() {
  return (
    <div className="space-y-8">
      <LimsPageIntro title="Notifications">
        <p>
          Your LSIMS inbox: job workflow events, system notices, and messages.
          Use filters to narrow by read state or type. Administrators and
          receptionists can send notifications to clients by email address.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          New items appear in near real time via periodic refresh (about every
          25 seconds) while you are signed in. Open the bell in the header for
          a quick list.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <NotificationsCenter showStaffSendForm />
    </div>
  );
}
