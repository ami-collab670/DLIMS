import type { AuthPageContent } from "@/features/cms/types";

export const AUTH_PAGE_DEFAULTS = {
  loginTitle: "Sign in",
  loginDescription: "Use your LSIMS account email and password.",
  loginEmailLabel: "Email",
  loginPasswordLabel: "Password",
  loginForgotPasswordLabel: "Forgot password?",
  loginSubmitLabel: "Sign in",
  loginSubmittingLabel: "Signing in…",
  loginFooterPrompt: "No account?",
  loginFooterLinkLabel: "Create one",
  loginEmailPlaceholder: "you@organization.com",
  signupTitle: "Create account",
  signupDescription: "External client registration for LSIMS.",
  signupAccountSectionTitle: "Account",
  signupDetailsSectionTitle: "Your details",
  signupEmailLabel: "Email",
  signupPasswordLabel: "Password",
  signupPasswordConfirmLabel: "Confirm password",
  signupFirstNameLabel: "First name",
  signupLastNameLabel: "Last name",
  signupOrganizationLabel: "Organization (optional)",
  signupPhoneLabel: "Phone (optional)",
  signupSubmitLabel: "Create account",
  signupSubmittingLabel: "Creating account…",
  signupFooterPrompt: "Already have an account?",
  signupFooterLinkLabel: "Sign in",
  signupEmailPlaceholder: "you@organization.com",
  signupPasswordsMismatchLabel: "Passwords do not match",
  forgotTitle: "Forgot password",
  forgotRequestDescription:
    "Enter your account email to receive a one-time reset code.",
  forgotConfirmDescription: "Enter the 6-digit code sent to your email.",
  forgotEmailLabel: "Email",
  forgotOtpLabel: "One-time code",
  forgotNewPasswordLabel: "New password",
  forgotConfirmPasswordLabel: "Confirm new password",
  forgotSendCodeLabel: "Send reset code",
  forgotSendingLabel: "Sending…",
  forgotResetLabel: "Reset password",
  forgotUpdatingLabel: "Updating…",
  forgotBackToSignInLabel: "Back to sign in",
  forgotDifferentEmailLabel: "Use a different email",
  forgotEmailPlaceholder: "you@organization.com",
  forgotOtpPlaceholder: "000000",
  loginBrandEyebrow: "Client & staff portal",
  loginBrandTagline:
    "Sign in to manage laboratory workflows, submit requests, and access certified results.",
  signupBrandEyebrow: "Client registration",
  signupBrandTagline:
    "Create an organization account to submit samples and receive results online.",
  forgotBrandEyebrow: "Account recovery",
  forgotBrandTagline:
    "Reset your password securely with a one-time code sent to your registered email.",
  trustBullets: [
    {
      title: "Accredited laboratory testing",
      description: "Validated methods and documented chain of custody.",
      iconKey: "shield-check",
    },
    {
      title: "Full sample traceability",
      description: "Track specimens from intake through certified results.",
      iconKey: "flask-conical",
    },
    {
      title: "Secure client portal",
      description: "Protected access for job requests, results, and reports.",
      iconKey: "lock",
    },
  ] satisfies AuthPageContent["trustBullets"],
} as const satisfies AuthPageContent;

export type AuthBrandVariant = "login" | "signup" | "forgot-password";

export function getAuthBrandCopy(
  authPage: Pick<
    AuthPageContent,
    | "loginBrandEyebrow"
    | "loginBrandTagline"
    | "signupBrandEyebrow"
    | "signupBrandTagline"
    | "forgotBrandEyebrow"
    | "forgotBrandTagline"
  >,
  variant: AuthBrandVariant,
): { eyebrow: string; tagline: string } {
  switch (variant) {
    case "login":
      return {
        eyebrow: authPage.loginBrandEyebrow,
        tagline: authPage.loginBrandTagline,
      };
    case "signup":
      return {
        eyebrow: authPage.signupBrandEyebrow,
        tagline: authPage.signupBrandTagline,
      };
    case "forgot-password":
      return {
        eyebrow: authPage.forgotBrandEyebrow,
        tagline: authPage.forgotBrandTagline,
      };
  }
}
