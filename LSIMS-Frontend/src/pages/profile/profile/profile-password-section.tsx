import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { changeOwnPassword } from "@/features/profile/api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  passwordChangeFormSchema,
  type PasswordChangeFormValues,
} from "@/schemas/password-change";
import { useAuthStore } from "@/stores/auth-store";

export function ProfilePasswordSection() {
  const user = useAuthStore((s) => s.user);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PasswordChangeFormValues) =>
      changeOwnPassword({
        current_password: values.current_password,
        new_password: values.new_password,
      }),
    onSuccess: () => {
      form.reset();
      toast.success(
        "Password updated. Your current session may remain active until you sign out or the token expires.",
      );
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (!user) return null;

  const { register, handleSubmit, watch, formState } = form;
  const newPassword = watch("new_password") ?? "";
  const confirmPassword = watch("confirm_password") ?? "";
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <section
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
      aria-labelledby="password-heading"
    >
      <h3 id="password-heading" className="text-sm font-medium">
        Change password
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Enter your current password, then choose a new one (at least 8 characters).
      </p>

      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="current_password">Current password</Label>
          <PasswordInput
            id="current_password"
            autoComplete="current-password"
            aria-invalid={!!formState.errors.current_password}
            {...register("current_password")}
          />
          {formState.errors.current_password ? (
            <p className="text-xs text-destructive">
              {formState.errors.current_password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_password">New password</Label>
          <PasswordInput
            id="new_password"
            autoComplete="new-password"
            minLength={8}
            aria-invalid={!!formState.errors.new_password}
            {...register("new_password")}
          />
          <PasswordStrengthIndicator password={newPassword} />
          {formState.errors.new_password ? (
            <p className="text-xs text-destructive">
              {formState.errors.new_password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <PasswordInput
            id="confirm_password"
            autoComplete="new-password"
            aria-invalid={!!formState.errors.confirm_password || passwordsMismatch}
            {...register("confirm_password")}
          />
          {passwordsMismatch ? (
            <p className="text-xs text-destructive">Passwords do not match</p>
          ) : null}
          {formState.errors.confirm_password && !passwordsMismatch ? (
            <p className="text-xs text-destructive">
              {formState.errors.confirm_password.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Trouble signing in?{" "}
            <Link
              to="/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password
            </Link>
          </p>
          <Button type="submit" disabled={mutation.isPending} className="sm:shrink-0">
            {mutation.isPending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </section>
  );
}
