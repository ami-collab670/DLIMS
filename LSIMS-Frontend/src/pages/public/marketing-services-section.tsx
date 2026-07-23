import {
  CmsSectionSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { resolveCmsIcon } from "@/features/cms/icon-map";
import { useHomePage, useServices } from "@/features/cms/hooks";

import { MarketingFadeInView, MarketingGlowCard } from "./components/motion";
import { MarketingSectionHeader } from "./marketing-section-header";

export function MarketingServicesSection() {
  const homePage = useHomePage();
  const services = useServices();

  if (homePage.isLoading || services.isLoading) {
    return <CmsSectionSkeleton />;
  }

  if (
    homePage.isError ||
    services.isError ||
    !homePage.data?.servicesHeader ||
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

  const header = homePage.data.servicesHeader;

  return (
    <section
      aria-labelledby="marketing-services-heading"
      className="bg-background py-16 sm:py-20"
    >
      <MarketingFadeInView className="mx-auto max-w-7xl px-4">
        <MarketingSectionHeader
          eyebrow={header.eyebrow}
          title={header.title}
          titleId="marketing-services-heading"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.data.map((service) => {
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
      </MarketingFadeInView>
    </section>
  );
}
