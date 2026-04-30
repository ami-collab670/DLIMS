import type { UseFormReturn } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { LoginValues } from "./login-schema";

type Props = {
  form: UseFormReturn<LoginValues>;
  onSubmit: (values: LoginValues) => void;
  submitting: boolean;
};

export function LoginForm({ form, onSubmit, submitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
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

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link
          to="/signup"
          className="text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
