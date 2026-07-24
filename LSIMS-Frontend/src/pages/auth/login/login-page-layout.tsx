import type { ReactNode } from "react";

import { useAuthPageContent } from "@/features/cms/hooks/use-auth-page";

import { AuthPageLayout } from "../components/auth-page-layout";

export function LoginPageLayout({
  children,
  title,
  description,
  footer,
  headerExtra,
}: {
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
}) {
  const authPage = useAuthPageContent();

  return (
    <AuthPageLayout
      variant="login"
      title={title ?? authPage.loginTitle}
      description={description ?? authPage.loginDescription}
      footer={footer}
      headerExtra={headerExtra}
    >
      {children}
    </AuthPageLayout>
  );
}
