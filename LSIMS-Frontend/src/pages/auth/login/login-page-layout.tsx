import type { ReactNode } from "react";

import { AuthPageLayout } from "../components/auth-page-layout";

export function LoginPageLayout({
  children,
  title = "Sign in",
  description = "Use your LSIMS account email and password.",
  footer,
  headerExtra,
}: {
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
}) {
  return (
    <AuthPageLayout
      variant="login"
      title={title}
      description={description}
      footer={footer}
      headerExtra={headerExtra}
    >
      {children}
    </AuthPageLayout>
  );
}
