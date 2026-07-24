import { ROUTES } from "@/lib/routing";
import type { UseFormReturn } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuthPageContent } from "@/features/cms/hooks/use-auth-page";

import type { LoginValues } from "@/lib/validation/auth/login-schema";

type Props = {
  form: UseFormReturn<LoginValues>;
  onSubmit: (values: LoginValues) => void;
  submitting: boolean;
};

export function LoginForm({ form, onSubmit, submitting }: Props) {
  const authPage = useAuthPageContent();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">{authPage.loginEmailLabel}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={authPage.loginEmailPlaceholder}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">{authPage.loginPasswordLabel}</Label>
          <Link
            to={ROUTES.forgotPassword}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {authPage.loginForgotPasswordLabel}
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? authPage.loginSubmittingLabel : authPage.loginSubmitLabel}
      </Button>

      <p className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
        {authPage.loginFooterPrompt}{" "}
        <Link
          to={ROUTES.signup}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {authPage.loginFooterLinkLabel}
        </Link>
      </p>
    </form>
  );
}
