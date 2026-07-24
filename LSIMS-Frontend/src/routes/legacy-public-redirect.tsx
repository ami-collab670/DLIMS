import { Navigate } from "react-router-dom";

import { localizePath } from "@/lib/i18n/localize-path";
import { getPreferredLocale } from "@/lib/i18n/locales";

type LegacyPublicRedirectProps = {
  to: string;
};

export function LegacyPublicRedirect({ to }: LegacyPublicRedirectProps) {
  const locale = getPreferredLocale();
  return <Navigate to={localizePath(to, locale)} replace />;
}
