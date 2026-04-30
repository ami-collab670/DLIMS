import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { fetchProfile, loginRequest } from "@/features/auth/api";
import { getDashboardPath } from "@/lib/dashboard-path";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";

import { LoginForm } from "./login-form";
import { LoginPageLayout } from "./login-page-layout";
import { loginSchema, type LoginValues } from "./login-schema";

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const tokens = await loginRequest(values.email, values.password);
      setTokens(tokens.access, tokens.refresh);
      const user = await fetchProfile();
      setUser(user);
      toast.success("Signed in.");
      navigate(getDashboardPath(user), { replace: true });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginPageLayout>
      <LoginForm form={form} onSubmit={onSubmit} submitting={submitting} />
    </LoginPageLayout>
  );
}
