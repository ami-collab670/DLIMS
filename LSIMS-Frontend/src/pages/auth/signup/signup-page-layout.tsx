import type { ReactNode } from "react";

import { AuthPageLayout } from "../components/auth-page-layout";

export function SignupPageLayout({ children }: { children: ReactNode }) {
  return (
    <AuthPageLayout
      variant="signup"
      title="Create account"
      description="External client registration for LSIMS."
      maxWidth="lg"
    >
      {children}
    </AuthPageLayout>
  );
}
