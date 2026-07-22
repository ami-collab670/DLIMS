import { ROUTES } from "@/lib/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import {
  useConfirmPasswordReset,
  useRequestPasswordReset,
} from "@/features/auth/hooks";

import { LoginPageLayout } from "../login/login-page-layout";

const requestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const confirmSchema = z
  .object({
    email: z.string().email(),
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RequestValues = z.infer<typeof requestSchema>;
type ConfirmValues = z.infer<typeof confirmSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [emailForReset, setEmailForReset] = useState("");

  const requestMut = useRequestPasswordReset();
  const confirmMut = useConfirmPasswordReset();

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const confirmForm = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
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

  function onRequest(values: RequestValues) {
    const email = values.email.trim().toLowerCase();
    requestMut.mutate(email, {
      onSuccess: () => {
        setEmailForReset(email);
        confirmForm.setValue("email", email);
        setStep("confirm");
        toast.success(
          "If that account exists, a reset code was sent to your email.",
        );
      },
    });
  }

  function onConfirm(values: ConfirmValues) {
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
    <LoginPageLayout
      title="Forgot password"
      description={
        step === "request"
          ? "Enter your account email to receive a one-time reset code."
          : `Enter the 6-digit code sent to ${emailForReset || "your email"}.`
      }
    >
      {step === "request" ? (
        <form
          className="space-y-4 text-left"
          onSubmit={requestForm.handleSubmit(onRequest)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              {...requestForm.register("email")}
            />
            {requestForm.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {requestForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset code"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to={ROUTES.login} className="font-medium text-primary underline-offset-4 hover:underline">
              ← Back to sign in
            </Link>
          </p>
        </form>
      ) : (
        <form
          className="space-y-4 text-left"
          onSubmit={confirmForm.handleSubmit(onConfirm)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="confirm-email">Email</Label>
            <Input
              id="confirm-email"
              type="email"
              autoComplete="email"
              {...confirmForm.register("email")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-otp">One-time code</Label>
            <Input
              id="confirm-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              {...confirmForm.register("otp")}
            />
            {confirmForm.formState.errors.otp ? (
              <p className="text-xs text-destructive">
                {confirmForm.formState.errors.otp.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new">New password</Label>
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
            <Label htmlFor="confirm-repeat">Confirm new password</Label>
            <PasswordInput
              id="confirm-repeat"
              autoComplete="new-password"
              aria-invalid={
                !!confirmForm.formState.errors.confirm_password || passwordsMismatch
              }
              {...confirmForm.register("confirm_password")}
            />
            {passwordsMismatch ? (
              <p className="text-xs text-destructive">Passwords do not match</p>
            ) : null}
            {confirmForm.formState.errors.confirm_password && !passwordsMismatch ? (
              <p className="text-xs text-destructive">
                {confirmForm.formState.errors.confirm_password.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating…" : "Reset password"}
          </Button>
          <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setStep("request");
                confirmForm.reset();
              }}
            >
              Use a different email
            </button>
            <Link to={ROUTES.login} className="font-medium text-primary underline-offset-4 hover:underline">
              ← Back to sign in
            </Link>
          </div>
        </form>
      )}
    </LoginPageLayout>
  );
}
