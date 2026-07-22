import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useLogin } from "@/features/auth/hooks";
import { fetchProfile } from "@/features/profile/api";
import { getDashboardPath } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth-store";

import { LoginForm } from "./login-form";
import { LoginPageLayout } from "./login-page-layout";
import { loginSchema, type LoginValues } from "@/lib/validation/auth/login-schema";

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const loginMut = useLogin({
    onSuccess: async (tokens) => {
      setTokens(tokens.access, tokens.refresh);
      const user = await fetchProfile();
      setUser(user);
      toast.success("Signed in.");
      navigate(getDashboardPath(user), { replace: true });
    },
  });

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginValues) {
    loginMut.mutate({ email: values.email, password: values.password });
  }

  return (
    <LoginPageLayout>
      <LoginForm form={form} onSubmit={onSubmit} submitting={loginMut.isPending} />
    </LoginPageLayout>
  );
}
