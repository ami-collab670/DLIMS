import type { ReactNode } from "react";
import { ROUTES } from "@/lib/routing";
import type { UseFormReturn } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { PhoneInputField } from "@/components/ui/phone-input";

import type { SignupValues } from "@/lib/validation/auth/signup-schema";

type Props = {
  form: UseFormReturn<SignupValues>;
  onSubmit: (values: SignupValues) => void;
  submitting: boolean;
};

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function SignupForm({ form, onSubmit, submitting }: Props) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const password = watch("password") ?? "";
  const passwordConfirm = watch("passwordConfirm") ?? "";
  const passwordsMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Account">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@organization.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <PasswordStrengthIndicator password={password} />
            {errors.password ? (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Confirm password</Label>
            <PasswordInput
              id="passwordConfirm"
              autoComplete="new-password"
              aria-invalid={!!errors.passwordConfirm || passwordsMismatch}
              {...register("passwordConfirm")}
            />
            {passwordsMismatch ? (
              <p className="text-xs text-destructive">Passwords do not match</p>
            ) : null}
            {errors.passwordConfirm && !passwordsMismatch ? (
              <p className="text-xs text-destructive">
                {errors.passwordConfirm.message}
              </p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Your details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              autoComplete="given-name"
              {...register("first_name")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              autoComplete="family-name"
              {...register("last_name")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="organization_name">Organization (optional)</Label>
            <Input id="organization_name" {...register("organization_name")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <PhoneInputField control={control} name="phone" id="phone" />
            {errors.phone ? (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to={ROUTES.login}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
