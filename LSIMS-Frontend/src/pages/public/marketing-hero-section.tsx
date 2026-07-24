import { useCallback } from "react";

import {
  CmsHeroSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useHomePage } from "@/features/cms/hooks";
import type { HeroSlide } from "@/features/cms/types";
import { getDashboardPath, ROUTES } from "@/lib/routing";
import type { AuthUser } from "@/types/auth";
import { usePublicLocale } from "@/providers/locale-provider";

import {
  MarketingHeroSlider,
  type HeroSlideCta,
} from "./components/marketing-hero-slider";

export function MarketingHeroSection({
  user,
  ready,
}: {
  user: AuthUser | null;
  ready: boolean;
}) {
  const { localizePath } = usePublicLocale();
  const { data, isLoading, isError, refetch } = useHomePage();

  const getPrimaryCta = useCallback(
    (slide: HeroSlide): HeroSlideCta | null => {
      if (user) {
        return { label: "Go to dashboard", href: getDashboardPath(user) };
      }

      return (
        slide.primaryCta ?? {
          label: "Sign in",
          href: ROUTES.login,
        }
      );
    },
    [user],
  );

  const getSecondaryCta = useCallback(
    (slide: HeroSlide): HeroSlideCta | null => {
      if (user) return null;

      return (
        slide.secondaryCta ?? {
          label: "Our services",
          href: localizePath(ROUTES.services.root),
        }
      );
    },
    [localizePath, user],
  );

  if (isLoading) {
    return <CmsHeroSkeleton />;
  }

  if (isError || !data) {
    return <CmsUnavailablePanel onRetry={() => void refetch()} />;
  }

  return (
    <MarketingHeroSlider
      slides={data.heroSlides}
      ready={ready}
      getPrimaryCta={getPrimaryCta}
      getSecondaryCta={getSecondaryCta}
    />
  );
}
