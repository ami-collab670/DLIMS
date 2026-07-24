import type { AuthPageContent, StrapiAuthPage, StrapiValueProp } from "@/features/cms/types";

function mapTrustBullets(
  bullets: StrapiValueProp[] | null | undefined,
): AuthPageContent["trustBullets"] {
  if (!bullets?.length) {
    return [];
  }

  return bullets.map((bullet) => ({
    title: bullet.title,
    description: bullet.description,
    iconKey: bullet.iconKey,
  }));
}

export function mapAuthPage(data: StrapiAuthPage): AuthPageContent {
  return {
    loginTitle: data.loginTitle,
    loginDescription: data.loginDescription,
    loginEmailLabel: data.loginEmailLabel,
    loginPasswordLabel: data.loginPasswordLabel,
    loginForgotPasswordLabel: data.loginForgotPasswordLabel,
    loginSubmitLabel: data.loginSubmitLabel,
    loginSubmittingLabel: data.loginSubmittingLabel,
    loginFooterPrompt: data.loginFooterPrompt,
    loginFooterLinkLabel: data.loginFooterLinkLabel,
    loginEmailPlaceholder: data.loginEmailPlaceholder,
    signupTitle: data.signupTitle,
    signupDescription: data.signupDescription,
    signupAccountSectionTitle: data.signupAccountSectionTitle,
    signupDetailsSectionTitle: data.signupDetailsSectionTitle,
    signupEmailLabel: data.signupEmailLabel,
    signupPasswordLabel: data.signupPasswordLabel,
    signupPasswordConfirmLabel: data.signupPasswordConfirmLabel,
    signupFirstNameLabel: data.signupFirstNameLabel,
    signupLastNameLabel: data.signupLastNameLabel,
    signupOrganizationLabel: data.signupOrganizationLabel,
    signupPhoneLabel: data.signupPhoneLabel,
    signupSubmitLabel: data.signupSubmitLabel,
    signupSubmittingLabel: data.signupSubmittingLabel,
    signupFooterPrompt: data.signupFooterPrompt,
    signupFooterLinkLabel: data.signupFooterLinkLabel,
    signupEmailPlaceholder: data.signupEmailPlaceholder,
    signupPasswordsMismatchLabel: data.signupPasswordsMismatchLabel,
    forgotTitle: data.forgotTitle,
    forgotRequestDescription: data.forgotRequestDescription,
    forgotConfirmDescription: data.forgotConfirmDescription,
    forgotEmailLabel: data.forgotEmailLabel,
    forgotOtpLabel: data.forgotOtpLabel,
    forgotNewPasswordLabel: data.forgotNewPasswordLabel,
    forgotConfirmPasswordLabel: data.forgotConfirmPasswordLabel,
    forgotSendCodeLabel: data.forgotSendCodeLabel,
    forgotSendingLabel: data.forgotSendingLabel,
    forgotResetLabel: data.forgotResetLabel,
    forgotUpdatingLabel: data.forgotUpdatingLabel,
    forgotBackToSignInLabel: data.forgotBackToSignInLabel,
    forgotDifferentEmailLabel: data.forgotDifferentEmailLabel,
    forgotEmailPlaceholder: data.forgotEmailPlaceholder,
    forgotOtpPlaceholder: data.forgotOtpPlaceholder,
    loginBrandEyebrow: data.loginBrandEyebrow,
    loginBrandTagline: data.loginBrandTagline,
    signupBrandEyebrow: data.signupBrandEyebrow,
    signupBrandTagline: data.signupBrandTagline,
    forgotBrandEyebrow: data.forgotBrandEyebrow,
    forgotBrandTagline: data.forgotBrandTagline,
    trustBullets: mapTrustBullets(data.trustBullets),
  };
}
