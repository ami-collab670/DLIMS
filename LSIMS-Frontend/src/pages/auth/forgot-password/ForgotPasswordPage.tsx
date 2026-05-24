import { Link } from "react-router-dom";

import { LoginPageLayout } from "../login/login-page-layout";

/**
 * Backend: no public password-reset or email token flow in `accounts.auth_urls` snapshot.
 */
export default function ForgotPasswordPage() {
  return (
    <LoginPageLayout
      title="Forgot password"
      description="Self-service reset is not exposed by the current API. An administrator can issue a new password from user management."
    >
      <div className="space-y-4 text-left text-sm text-muted-foreground">
        <p>
          Admins may use{" "}
          <code className="rounded bg-muted px-1">POST /api/accounts/users/:id/change-password/</code>{" "}
          from the interactive docs or staff tools.
        </p>
        <p>
          <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
            Create a client account
          </Link>{" "}
          if you are new to the portal.
        </p>
        <p>
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </LoginPageLayout>
  );
}
