import { ArrowRight } from "lucide-react";

import {
  CmsPageSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useEvents, useHomePage } from "@/features/cms/hooks";
import { eventPath } from "@/lib/routing/path-builders";

import { MarketingPageHero } from "./components/marketing-page-hero";
import { MarketingPageShell } from "./components/marketing-page-shell";
import { MarketingGlowCard } from "./components/motion";
import { MarketingSectionHeader } from "./marketing-section-header";

export function EventsIndexPage() {
  const homePage = useHomePage();
  const events = useEvents();

  if (homePage.isLoading || events.isLoading) {
    return <CmsPageSkeleton lines={8} />;
  }

  if (
    homePage.isError ||
    events.isError ||
    !homePage.data?.eventsPageHeroTitle ||
    !events.data?.length
  ) {
    return (
      <CmsUnavailablePanel
        onRetry={() => {
          void homePage.refetch();
          void events.refetch();
        }}
      />
    );
  }

  const home = homePage.data;

  return (
    <div className="flex flex-1 flex-col">
      <MarketingPageHero
        title={home.eventsPageHeroTitle!}
        subtitle={home.eventsPageHeroSubtitle ?? ""}
      />
      <MarketingPageShell>
        {home.eventsIndexHeader ? (
          <MarketingSectionHeader
            eyebrow={home.eventsIndexHeader.eyebrow}
            title={home.eventsIndexHeader.title}
            titleId="events-index-heading"
          />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {events.data!.map((event) => (
            <MarketingGlowCard
              key={event.slug}
              to={eventPath(event.slug)}
              className="flex flex-col p-6"
            >
              <span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {event.status}
              </span>
              <h3 className="mt-3 text-lg font-semibold group-hover:text-primary">
                {event.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {event.description}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {event.date} · {event.location}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                View details
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </MarketingGlowCard>
          ))}
        </div>
      </MarketingPageShell>
    </div>
  );
}
