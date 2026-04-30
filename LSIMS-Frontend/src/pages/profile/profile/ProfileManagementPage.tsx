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
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";
import { useAuthStore } from "@/stores/auth-store";

import { ProfileAccountSection } from "./profile-account-section";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfilePageHeader } from "./profile-page-header";
import { ProfileStaffWorkspaceCard } from "./profile-staff-workspace-card";
import { emptyToUndefined } from "./utils";

type Props = {
  title?: string;
  description?: string;
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
    <div
      className={
        showStaffWorkspace
          ? "mx-auto max-w-4xl space-y-8"
          : "mx-auto max-w-2xl space-y-8"
      }
    >
      <ProfilePageHeader title={title} description={description} />

      {authUser?.user_type === "internal" ? <StaffRoleBanner /> : null}

      {isLoading || !profile ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      ) : (
        <>
          <ProfileAccountSection profile={profile} />
          <ProfileEditForm
            form={form}
            profile={profile}
            onSubmit={onSubmit}
            isPending={mutation.isPending}
          />
          {showStaffWorkspace ? <ProfileStaffWorkspaceCard /> : null}
        </>
      )}
    </div>
  );
}
