import { Building2 } from "lucide-react";

import {
  CmsPageSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { resolveCmsIcon } from "@/features/cms/icon-map";
import { useAboutPage } from "@/features/cms/hooks";
import { useAuthStore } from "@/stores/auth-store";

import { MarketingPageHero } from "./components/marketing-page-hero";
import { MarketingPageShell } from "./components/marketing-page-shell";
import { MarketingTimeline } from "./components/marketing-timeline";
import { MarketingCtaBanner } from "./marketing-cta-banner";
import {
  MarketingFadeInView,
  MarketingGlowCard,
  MarketingStaggerGrid,
} from "./components/motion";
import { MarketingPartnersStrip } from "./marketing-partners-strip";
import { MarketingSectionHeader } from "./marketing-section-header";
import { MarketingStatsSection } from "./marketing-stats-section";

export function AboutPage() {
  const { user, ready } = useAuthStore();
  const { data, isLoading, isError, refetch } = useAboutPage();

  if (isLoading) {
    return <CmsPageSkeleton lines={8} />;
  }

  if (isError || !data) {
    return <CmsUnavailablePanel onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <MarketingPageHero
        title={data.heroTitle}
        subtitle={data.heroSubtitle}
        icon={Building2}
      />

      <MarketingPageShell>
        <MarketingFadeInView className="grid gap-8 md:grid-cols-[1fr_280px] md:items-start">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {data.missionTitle}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {data.missionBody}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {data.visionTitle}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {data.visionBody}
              </p>
            </div>
          </div>

          {data.highlight ? (
            <aside className="relative overflow-hidden rounded-xl bg-foreground p-6 text-background md:sticky md:top-24">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85"
                aria-hidden
              />
              <div className="relative z-10">
                <p className="text-xs font-medium uppercase tracking-wide text-background/70">
                  {data.highlight.label}
                </p>
                <p className="mt-2 text-4xl font-semibold tabular-nums">
                  {data.highlight.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-background/85">
                  {data.highlight.context}
                </p>
              </div>
            </aside>
          ) : null}
        </MarketingFadeInView>
      </MarketingPageShell>

      <MarketingStatsSection />

      <MarketingPageShell>
        {data.valuesHeader ? (
          <MarketingSectionHeader
            eyebrow={data.valuesHeader.eyebrow}
            title={data.valuesHeader.title}
            titleId="about-values-heading"
          />
        ) : null}
        <MarketingStaggerGrid className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.values.map((value) => {
            const Icon = resolveCmsIcon(value.iconKey);
            return (
              <MarketingGlowCard key={value.title} className="p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5 text-primary" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </MarketingGlowCard>
            );
          })}
        </MarketingStaggerGrid>

        {data.milestonesHeader ? (
          <div className="mt-16">
            <MarketingSectionHeader
              eyebrow={data.milestonesHeader.eyebrow}
              title={data.milestonesHeader.title}
              titleId="about-milestones-heading"
            />
            <MarketingTimeline milestones={data.milestones} />
          </div>
        ) : null}

        {data.accreditationHeader ? (
          <div className="mt-16">
            <MarketingSectionHeader
              eyebrow={data.accreditationHeader.eyebrow}
              title={data.accreditationHeader.title}
              titleId="about-accreditation-heading"
            />
            <MarketingFadeInView className="mt-8 grid gap-6 md:grid-cols-3">
              {data.accreditation.map((item) => {
                const Icon = resolveCmsIcon(item.iconKey);
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-6 text-primary" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </MarketingFadeInView>
          </div>
        ) : null}
      </MarketingPageShell>

      <MarketingPartnersStrip variant="about" />
      <MarketingCtaBanner user={user} ready={ready} />
    </div>
  );
}
