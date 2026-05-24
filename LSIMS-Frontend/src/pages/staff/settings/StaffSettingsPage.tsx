<<<<<<< HEAD
import { Navigate } from "react-router-dom";

/** Legacy route — combined profile & settings live on /staff/profile. */
export default function StaffSettingsPage() {
  return <Navigate to="/staff/profile" replace />;
=======
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import { useAuthStore } from "@/stores/auth-store";

import { ProfileStaffWorkspaceCard } from "@/pages/profile/profile/profile-staff-workspace-card";

/**
 * Dedicated workspace settings (theme, session, docs). Profile form stays on /staff/profile.
 */
export default function StaffSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const roleLabel =
    user?.role_detail?.display_name ??
    user?.role_detail?.role_name?.replace(/_/g, " ") ??
    (user?.is_superuser ? "Superuser" : null);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Workspace preferences and session controls. Contact and organization fields live on{" "}
          <Link to="/staff/profile" className="text-primary underline-offset-4 hover:underline">
            Profile
          </Link>
          .
        </p>
      </div>

      <StaffRoleBanner />

      {user ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium">Signed in as</h3>
          <p className="mt-2 truncate text-sm font-medium">{user.email}</p>
          {roleLabel ? (
            <p className="mt-1 text-xs text-muted-foreground capitalize">{roleLabel}</p>
          ) : null}
          <Button type="button" variant="secondary" size="sm" className="mt-4" asChild>
            <Link to="/staff/profile">Edit profile &amp; contact</Link>
          </Button>
        </section>
      ) : null}

      <ProfileStaffWorkspaceCard />
    </div>
  );
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
}
