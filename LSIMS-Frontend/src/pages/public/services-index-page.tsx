import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CmsPageSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { resolveCmsIcon } from "@/features/cms/icon-map";
import { useHomePage, useServices } from "@/features/cms/hooks";
import { ROUTES } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth-store";

import { MarketingPageHero } from "./components/marketing-page-hero";
import { MarketingPageShell } from "./components/marketing-page-shell";
import { MarketingProcessSteps } from "./components/marketing-process-steps";
import { MarketingCtaBanner } from "./marketing-cta-banner";
import { MarketingFadeInView, MarketingGlowCard } from "./components/motion";
import { MarketingSectionHeader } from "./marketing-section-header";

export function ServicesIndexPage() {
  const { user, ready } = useAuthStore();
  const homePage = useHomePage();
  const services = useServices();

  if (homePage.isLoading || services.isLoading) {
    return <CmsPageSkeleton lines={8} />;
  }

  if (
    homePage.isError ||
    services.isError ||
    !homePage.data?.servicesPageHeroTitle ||
    !services.data?.length
  ) {
    return (
      <CmsUnavailablePanel
        onRetry={() => {
          void homePage.refetch();
          void services.refetch();
        }}
      />
    );
  }

  const { data: home } = homePage;

  return (
    <div className="flex flex-1 flex-col">
      <MarketingPageHero
        title={home.servicesPageHeroTitle!}
        subtitle={home.servicesPageHeroSubtitle ?? ""}
      />
      <MarketingPageShell>
        {home.servicesHeader ? (
          <MarketingSectionHeader
            eyebrow={home.servicesHeader.eyebrow}
            title={home.servicesHeader.title}
            titleId="services-index-heading"
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.data!.map((service) => {
            const Icon = resolveCmsIcon(service.iconKey);
            return (
              <MarketingGlowCard
                key={service.slug}
                to={service.href}
                className="p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon
                    className="size-5 text-muted-foreground group-hover:text-primary"
                    aria-hidden
                  />
                </div>
                <h3 className="mt-4 text-base font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </MarketingGlowCard>
            );
          })}
        </div>

        {home.processHeader && home.processSteps.length ? (
          <div className="mt-16">
            <MarketingSectionHeader
              eyebrow={home.processHeader.eyebrow}
              title={home.processHeader.title}
              titleId="services-process-heading"
            />
            <MarketingProcessSteps steps={home.processSteps} />
          </div>
        ) : null}

        {home.valuePropsHeader && home.valueProps.length ? (
          <div className="mt-16">
            <MarketingSectionHeader
              eyebrow={home.valuePropsHeader.eyebrow}
              title={home.valuePropsHeader.title}
              titleId="services-values-heading"
            />
            <MarketingFadeInView className="grid gap-6 md:grid-cols-3">
              {home.valueProps.map((value) => {
                const Icon = resolveCmsIcon(value.iconKey);
                return (
                  <div
                    key={value.title}
                    className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm"
                  >
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-7 text-primary" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{value.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </MarketingFadeInView>
          </div>
        ) : null}

        <div className="mt-12 flex justify-center">
          <Button asChild size="lg">
            <Link to={ROUTES.contact.root}>
              Contact the laboratory
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </MarketingPageShell>
      <MarketingCtaBanner user={user} ready={ready} />
    </div>
  );
}
