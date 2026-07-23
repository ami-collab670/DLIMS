import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  CmsSectionSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useHomePage } from "@/features/cms/hooks";
import { getDashboardPath } from "@/lib/routing";
import type { AuthUser } from "@/types/auth";

import { MarketingFadeInView } from "./components/motion";

export function MarketingCtaBanner({
  user,
  ready,
}: {
  user: AuthUser | null;
  ready: boolean;
}) {
  const { data, isLoading, isError, refetch } = useHomePage();

  if (isLoading) {
    return <CmsSectionSkeleton />;
  }

  if (
    isError ||
    !data?.featuredBannerTitle ||
    !data.featuredBannerDescription ||
    !data.featuredBannerCtaLabel
  ) {
    return <CmsUnavailablePanel onRetry={() => void refetch()} />;
  }

  const ctaHref = user
    ? getDashboardPath(user)
    : (data.featuredBannerCtaHref ?? "/signup");
  const ctaLabel = user ? "Go to dashboard" : data.featuredBannerCtaLabel;

  return (
    <section
      aria-labelledby="marketing-cta-heading"
      className="px-4 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <MarketingFadeInView className="relative overflow-hidden rounded-2xl border border-border bg-foreground px-6 py-10 sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-foreground via-foreground/95 to-foreground/70"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2
                id="marketing-cta-heading"
                className="text-xl font-semibold tracking-tight text-background sm:text-2xl"
              >
                {data.featuredBannerTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-background/85 sm:text-base">
                {data.featuredBannerDescription}
              </p>
            </div>
            {ready ? (
              <Button asChild size="lg" variant="secondary" className="shrink-0">
                <Link to={ctaHref}>{ctaLabel}</Link>
              </Button>
            ) : null}
          </div>
        </MarketingFadeInView>
      </div>
    </section>
  );
}
