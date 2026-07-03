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
import { useAuthStore } from "@/stores/auth-store";

import { ProfileAccountSection } from "./profile-account-section";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfilePageHeader } from "./profile-page-header";
import { ProfilePasswordSection } from "./profile-password-section";
import { ProfileStaffPermissionsSection } from "./profile-staff-permissions-section";
import { ProfileWorkspaceSettingsCard } from "./profile-workspace-settings-card";
import { emptyToUndefined } from "./utils";

type Props = {
  title?: string;
  description?: string;
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
    <div className="mx-auto max-w-4xl space-y-8">
      <ProfilePageHeader title={title} description={description} />

      {isLoading || !profile ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      ) : (
        <>
          <ProfileAccountSection profile={profile} extended={staffProfile} />
          {staffProfile ? <ProfileStaffPermissionsSection profile={profile} /> : null}
          <ProfileEditForm
            form={form}
            profile={profile}
            onSubmit={onSubmit}
            isPending={mutation.isPending}
          />
          <ProfilePasswordSection />
          {showWorkspaceSettings ? <ProfileWorkspaceSettingsCard /> : null}
        </>
      )}
    </div>
  );
}
