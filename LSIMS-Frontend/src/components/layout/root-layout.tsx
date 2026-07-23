import { Outlet, useLocation } from "react-router-dom";

import { ThemeProviders } from "@/components/ThemeProviders";
import { PublicFooter } from "@/components/layout/public/public-footer";
import { Header } from "@/components/layout/root/Header";
import { CmsDevFallbackBanner } from "@/features/cms/components/cms-dev-fallback-banner";
import { ROUTES } from "@/lib/routing";

const AUTH_ROUTES = [ROUTES.login, ROUTES.signup, ROUTES.forgotPassword] as const;
const PREVIEW_ROUTE = ROUTES.preview;

export function RootLayout() {
  const { pathname } = useLocation();
  const isAuthRoute = AUTH_ROUTES.includes(
    pathname as (typeof AUTH_ROUTES)[number],
  );
  const hidePublicChrome =
    pathname.startsWith("/staff") ||
    pathname.startsWith("/client") ||
    pathname === PREVIEW_ROUTE ||
    isAuthRoute;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ThemeProviders>
        {!hidePublicChrome ? (
          <>
            <CmsDevFallbackBanner />
            <Header />
          </>
        ) : null}
        <Outlet />
        {!hidePublicChrome ? <PublicFooter /> : null}
      </ThemeProviders>
    </div>
  );
}
