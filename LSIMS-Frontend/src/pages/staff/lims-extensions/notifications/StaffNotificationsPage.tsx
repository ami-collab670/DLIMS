import { NotificationsCenter } from "@/features/notifications/components/notifications-center";
import { isFinance, isReceptionist } from "@/lib/staff";
import { useAuthStore } from "@/stores/auth-store";

import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

export default function StaffNotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const receptionist = isReceptionist(user);
  const finance = isFinance(user);

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Notifications">
        {finance ? (
          <p>
            Your LSIMS inbox for payment and job workflow events. This is a
            read-only inbox for Finance — sending is not yet enabled for this
            role; contact clients and reception directly using the contact
            details shown on job invoices.
          </p>
        ) : receptionist ? (
          <p>
            Your LSIMS inbox and outbound messages to clients and Finance. When
            sending, pick a client from the directory or enter your finance desk
            contact email.
          </p>
        ) : (
          <p>
            Your LSIMS inbox: job workflow events, system notices, and messages.
            Use filters to narrow by read state or type. Administrators and
            receptionists can send notifications to clients by email address.
          </p>
        )}
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
