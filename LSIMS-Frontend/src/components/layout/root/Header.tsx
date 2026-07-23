import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { APP_NAME_FALLBACK } from "@/features/cms/defaults";
import { useHomePage, useServices, useSiteSettings } from "@/features/cms/hooks";
import { resolvePublicNavLinks } from "@/features/cms/resolve-public-nav-links";
import { ROUTES } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth-store";

import { ThemeToggler } from "@/components/ThemeToggler";
import { PublicHeaderActions } from "@/components/layout/public/public-header-actions";
import { PublicNavDesktop, PublicNavMobile } from "@/components/layout/public/public-nav";
import { PublicServicesMegaMenu } from "@/components/layout/public/public-services-mega-menu";

const SERVICES_CLOSE_DELAY_MS = 150;

export function Header() {
  const { user, ready, clearSession } = useAuthStore();
  const { data: siteSettings, isLoading: siteSettingsLoading } = useSiteSettings();
  const { data: homePage } = useHomePage();
  const { data: services } = useServices();
  const [servicesOpen, setServicesOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const siteName = siteSettings?.siteName ?? (siteSettingsLoading ? "…" : APP_NAME_FALLBACK);
  const navLinks = useMemo(
    () => resolvePublicNavLinks(siteSettings?.navLinks ?? []),
    [siteSettings?.navLinks],
  );

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setServicesOpen(false);
      closeTimerRef.current = null;
    }, SERVICES_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const handleServicesOpenChange = useCallback(
    (open: boolean) => {
      clearCloseTimer();
      setServicesOpen(open);
    },
    [clearCloseTimer],
  );

  const megaMenuReady =
    services?.length &&
    homePage?.servicesMegaMenuEyebrow &&
    homePage.servicesMegaMenuTitle &&
    homePage.servicesMegaMenuDescription;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div
        className="relative"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3">
          <Link
            to={ROUTES.home}
            className="justify-self-start shrink-0 text-xl font-semibold tracking-tight hover:opacity-90"
          >
            {siteName}
          </Link>

          <div className="justify-self-center">
            <PublicNavDesktop
              navLinks={navLinks}
              services={services ?? []}
              servicesOpen={servicesOpen}
              onServicesOpenChange={handleServicesOpenChange}
            />
          </div>

          <div className="flex items-center justify-self-end gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <PublicHeaderActions
                user={user}
                ready={ready}
                clearSession={clearSession}
              />
              <div className="border-l border-border pl-2">
                <ThemeToggler />
              </div>
            </div>
            <PublicNavMobile
              navLinks={navLinks}
              services={services ?? []}
              onServicesOpenChange={handleServicesOpenChange}
              mobileActions={
                <PublicHeaderActions
                  user={user}
                  ready={ready}
                  clearSession={clearSession}
                  compact
                />
              }
            />
          </div>
        </div>

        {servicesOpen && megaMenuReady ? (
          <div className="hidden border-t border-border bg-background shadow-sm md:block">
            <PublicServicesMegaMenu
              services={services}
              eyebrow={homePage.servicesMegaMenuEyebrow!}
              title={homePage.servicesMegaMenuTitle!}
              description={homePage.servicesMegaMenuDescription!}
              onNavigate={() => setServicesOpen(false)}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
