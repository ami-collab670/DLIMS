import { ROUTES } from "@/lib/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import {
  useConfirmPasswordReset,
  useRequestPasswordReset,
} from "@/features/auth/hooks";
import { useAuthPageContent } from "@/features/cms/hooks/use-auth-page";
import {
  forgotPasswordConfirmSchema,
  type ForgotPasswordConfirmValues,
} from "@/lib/validation/auth/forgot-password-confirm-schema";
import {
  forgotPasswordRequestSchema,
  type ForgotPasswordRequestValues,
} from "@/lib/validation/auth/forgot-password-request-schema";

import { AuthPageLayout } from "../components/auth-page-layout";
import { AuthStepIndicator } from "../components/auth-step-indicator";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const authPage = useAuthPageContent();
  const [step, setStep] = useState<"request" | "confirm">("request");

  const requestMut = useRequestPasswordReset();
  const confirmMut = useConfirmPasswordReset();

  const requestForm = useForm<ForgotPasswordRequestValues>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { email: "" },
  });

  const confirmForm = useForm<ForgotPasswordConfirmValues>({
    resolver: zodResolver(forgotPasswordConfirmSchema),
    defaultValues: {
      email: "",
      otp: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const newPassword = confirmForm.watch("new_password") ?? "";
  const confirmPassword = confirmForm.watch("confirm_password") ?? "";
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const submitting =
    step === "request" ? requestMut.isPending : confirmMut.isPending;

  function onRequest(values: ForgotPasswordRequestValues) {
    const email = values.email.trim().toLowerCase();
    requestMut.mutate(email, {
      onSuccess: () => {
        confirmForm.setValue("email", email);
        setStep("confirm");
        toast.success(
          "If that account exists, a reset code was sent to your email.",
        );
      },
    });
  }

  function onConfirm(values: ForgotPasswordConfirmValues) {
    confirmMut.mutate(
      {
        email: values.email.trim().toLowerCase(),
        otp: values.otp.trim(),
        new_password: values.new_password,
      },
      {
        onSuccess: () => {
          toast.success(
            "Password updated. You can sign in with your new password.",
          );
          navigate(ROUTES.login, { replace: true });
        },
      },
    );
  }

  return (
    <AuthPageLayout
      variant="forgot-password"
      title={authPage.forgotTitle}
      description={
        step === "request"
          ? authPage.forgotRequestDescription
          : authPage.forgotConfirmDescription
      }
      headerExtra={<AuthStepIndicator activeStep={step} />}
    >
      {step === "request" ? (
        <form
          className="space-y-5 text-left"
          onSubmit={requestForm.handleSubmit(onRequest)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="reset-email">{authPage.forgotEmailLabel}</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder={authPage.forgotEmailPlaceholder}
              {...requestForm.register("email")}
            />
            {requestForm.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {requestForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? authPage.forgotSendingLabel : authPage.forgotSendCodeLabel}
          </Button>
          <p className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
            <Link
              to={ROUTES.login}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {authPage.forgotBackToSignInLabel}
            </Link>
          </p>
        </form>
      ) : (
        <form
          className="space-y-5 text-left"
          onSubmit={confirmForm.handleSubmit(onConfirm)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="confirm-email">{authPage.forgotEmailLabel}</Label>
            <Input
              id="confirm-email"
              type="email"
              autoComplete="email"
              {...confirmForm.register("email")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-otp">{authPage.forgotOtpLabel}</Label>
            <Input
              id="confirm-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={authPage.forgotOtpPlaceholder}
              className="tracking-widest"
              {...confirmForm.register("otp")}
            />
            {confirmForm.formState.errors.otp ? (
              <p className="text-xs text-destructive">
                {confirmForm.formState.errors.otp.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new">{authPage.forgotNewPasswordLabel}</Label>
            <PasswordInput
              id="confirm-new"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={!!confirmForm.formState.errors.new_password}
              {...confirmForm.register("new_password")}
            />
            <PasswordStrengthIndicator password={newPassword} />
            {confirmForm.formState.errors.new_password ? (
              <p className="text-xs text-destructive">
                {confirmForm.formState.errors.new_password.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-repeat">
              {authPage.forgotConfirmPasswordLabel}
            </Label>
            <PasswordInput
              id="confirm-repeat"
              autoComplete="new-password"
              aria-invalid={
                !!confirmForm.formState.errors.confirm_password || passwordsMismatch
              }
              {...confirmForm.register("confirm_password")}
            />
            {passwordsMismatch ? (
              <p className="text-xs text-destructive">
                {authPage.signupPasswordsMismatchLabel}
              </p>
            ) : null}
            {confirmForm.formState.errors.confirm_password && !passwordsMismatch ? (
              <p className="text-xs text-destructive">
                {confirmForm.formState.errors.confirm_password.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? authPage.forgotUpdatingLabel : authPage.forgotResetLabel}
          </Button>
          <div className="flex flex-col gap-2 border-t border-border pt-4 text-center text-sm text-muted-foreground">
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setStep("request");
                confirmForm.reset();
              }}
            >
              {authPage.forgotDifferentEmailLabel}
            </button>
            <Link
              to={ROUTES.login}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {authPage.forgotBackToSignInLabel}
            </Link>
          </div>
        </form>
      )}
    </AuthPageLayout>
  );
}
