import type { ReactNode } from "react";

import { useAuthPageContent } from "@/features/cms/hooks/use-auth-page";

import { AuthPageLayout } from "../components/auth-page-layout";

export function SignupPageLayout({ children }: { children: ReactNode }) {
  const authPage = useAuthPageContent();

  return (
    <AuthPageLayout
      variant="signup"
      title={authPage.signupTitle}
      description={authPage.signupDescription}
      maxWidth="lg"
    >
      {children}
    </AuthPageLayout>
  );
}
