import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { fetchProfile } from "@/features/auth/api";
import { updateProfile } from "@/features/profile/api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/schemas/profile";
<<<<<<< HEAD
=======
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import { useAuthStore } from "@/stores/auth-store";

import { ProfileAccountSection } from "./profile-account-section";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfilePageHeader } from "./profile-page-header";
<<<<<<< HEAD
import { ProfilePasswordSection } from "./profile-password-section";
import { ProfileStaffPermissionsSection } from "./profile-staff-permissions-section";
import { ProfileWorkspaceSettingsCard } from "./profile-workspace-settings-card";
=======
import { ProfileStaffWorkspaceCard } from "./profile-staff-workspace-card";
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import { emptyToUndefined } from "./utils";

type Props = {
  title?: string;
  description?: string;
<<<<<<< HEAD
  /** Show theme, session, and API docs card (default on). */
  showWorkspaceSettings?: boolean;
  /** Staff workspace: extended account + permissions card (no StaffRoleBanner). */
  staffProfile?: boolean;
};

export default function ProfileManagementPage({
  title = "Profile & settings",
  description = "Update your contact and organization details, manage security and workspace preferences.",
  showWorkspaceSettings = true,
  staffProfile = false,
}: Props) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
=======
  /** Staff: include workspace card (theme, session, API docs) on the same page. */
  showStaffWorkspace?: boolean;
};

export default function ProfileManagementPage({
  title = "Profile",
  description = "Update your contact details. Account type and role are managed by administrators.",
  showStaffWorkspace = false,
}: Props) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const authUser = useAuthStore((s) => s.user);

>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      nationality: "",
      organization_name: "",
      organization_type: "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (!profile) return;
    reset({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
      nationality: profile.nationality ?? "",
      organization_name: profile.organization_name ?? "",
      organization_type: profile.organization_type ?? "",
    });
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      setUser(user);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved.");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  function onSubmit(values: ProfileFormValues) {
    mutation.mutate({
      first_name: emptyToUndefined(values.first_name),
      last_name: emptyToUndefined(values.last_name),
      phone: emptyToUndefined(values.phone),
      nationality: emptyToUndefined(values.nationality),
      organization_name: emptyToUndefined(values.organization_name),
      organization_type: emptyToUndefined(values.organization_type),
    });
  }

  return (
<<<<<<< HEAD
    <div className="mx-auto max-w-4xl space-y-8">
      <ProfilePageHeader title={title} description={description} />

=======
    <div
      className={
        showStaffWorkspace
          ? "mx-auto max-w-4xl space-y-8"
          : "mx-auto max-w-2xl space-y-8"
      }
    >
      <ProfilePageHeader title={title} description={description} />

      {authUser?.user_type === "internal" ? <StaffRoleBanner /> : null}

>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
      {isLoading || !profile ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      ) : (
        <>
<<<<<<< HEAD
          <ProfileAccountSection profile={profile} extended={staffProfile} />
          {staffProfile ? <ProfileStaffPermissionsSection profile={profile} /> : null}
=======
          <ProfileAccountSection profile={profile} />
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
          <ProfileEditForm
            form={form}
            profile={profile}
            onSubmit={onSubmit}
            isPending={mutation.isPending}
          />
<<<<<<< HEAD
          <ProfilePasswordSection />
          {showWorkspaceSettings ? <ProfileWorkspaceSettingsCard /> : null}
=======
          {showStaffWorkspace ? <ProfileStaffWorkspaceCard /> : null}
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
        </>
      )}
    </div>
  );
}
