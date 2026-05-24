import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileFormValues } from "@/schemas/profile";
import type { AuthUser } from "@/types/auth";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
  profile: AuthUser;
  onSubmit: (values: ProfileFormValues) => void;
  isPending: boolean;
};

export function ProfileEditForm({
  form,
  profile,
  onSubmit,
  isPending,
}: Props) {
  const { register, handleSubmit, formState, reset } = form;

  return (
    <form
      className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <h3 className="text-sm font-medium">Editable details</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" {...register("first_name")} />
          {formState.errors.first_name ? (
            <p className="text-xs text-destructive">
              {formState.errors.first_name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" {...register("last_name")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register("phone")}
          />
        </div>
      </div>

      {/* <div className="space-y-4 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          Organization (especially for external accounts)
        </p>
        <div className="space-y-2">
          <Label htmlFor="organization_name">Organization name</Label>
          <Input id="organization_name" {...register("organization_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organization_type">Organization type</Label>
          <Input id="organization_type" {...register("organization_type")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input id="nationality" {...register("nationality")} />
        </div>
      </div> */}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset({
              first_name: profile.first_name ?? "",
              last_name: profile.last_name ?? "",
              phone: profile.phone ?? "",
              nationality: profile.nationality ?? "",
              organization_name: profile.organization_name ?? "",
              organization_type: profile.organization_type ?? "",
            });
          }}
          disabled={isPending}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
