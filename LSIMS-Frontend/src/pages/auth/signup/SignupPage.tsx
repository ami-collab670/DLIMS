import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { registerRequest } from "@/features/auth/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";

import { SignupForm } from "./signup-form";
import { SignupPageLayout } from "./signup-page-layout";
import { signupSchema, type SignupValues } from "./signup-schema";

export default function SignupPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      first_name: "",
      last_name: "",
      organization_name: "",
      phone: "",
    },
  });

  async function onSubmit(values: SignupValues) {
    setSubmitting(true);
    try {
      const res = await registerRequest({
        email: values.email,
        password: values.password,
        password_confirm: values.passwordConfirm,
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
        organization_name: values.organization_name || undefined,
        phone: values.phone || undefined,
      });
      setTokens(res.access, res.refresh);
      setUser(res.user);
      toast.success("Account created. You are signed in.");
      navigate("/client", { replace: true });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SignupPageLayout>
      <SignupForm form={form} onSubmit={onSubmit} submitting={submitting} />
    </SignupPageLayout>
  );
}
