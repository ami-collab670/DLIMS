import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useRegister } from "@/features/auth/hooks";
import { useAuthStore } from "@/stores/auth-store";

import { SignupForm } from "./signup-form";
import { SignupPageLayout } from "./signup-page-layout";
import { signupSchema, type SignupValues } from "@/lib/validation/auth/signup-schema";

export default function SignupPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const registerMut = useRegister({
    onSuccess: (res) => {
      setTokens(res.access, res.refresh);
      setUser(res.user);
      toast.success("Account created. You are signed in.");
      navigate("/client", { replace: true });
    },
  });

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

  function onSubmit(values: SignupValues) {
    registerMut.mutate({
      email: values.email,
      password: values.password,
      password_confirm: values.passwordConfirm,
      first_name: values.first_name || undefined,
      last_name: values.last_name || undefined,
      organization_name: values.organization_name || undefined,
      phone: values.phone || undefined,
    });
  }

  return (
    <SignupPageLayout>
      <SignupForm form={form} onSubmit={onSubmit} submitting={registerMut.isPending} />
    </SignupPageLayout>
  );
}
