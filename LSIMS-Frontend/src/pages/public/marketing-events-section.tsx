import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  CmsSectionSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useEvents, useHomePage } from "@/features/cms/hooks";
import { ROUTES } from "@/lib/routing";
import { eventPath } from "@/lib/routing/path-builders";
import { usePublicLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/ui";

import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
  usePrefersReducedMotion,
} from "./components/motion";
import { MarketingSectionHeader } from "./marketing-section-header";

export function MarketingEventsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { locale, localizePath } = usePublicLocale();
  const homePage = useHomePage();
  const events = useEvents();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (homePage.isLoading || events.isLoading) {
    return <CmsSectionSkeleton />;
  }

  if (
    homePage.isError ||
    events.isError ||
    !homePage.data?.eventsHeader ||
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

  const featured = events.data[activeIndex] ?? events.data[0];

  const panelMotion = prefersReducedMotion
    ? {}
    : {
        initial: { ...fadeUpHidden, x: 12 },
        animate: { ...fadeUpVisible, x: 0 },
        exit: { ...fadeUpHidden, x: 12 },
        transition: fadeUpTransition(),
      };

  return (
    <section
      aria-labelledby="marketing-events-heading"
      className="border-t border-border bg-muted/30 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4">
        <MarketingSectionHeader
          eyebrow={homePage.data.eventsHeader.eyebrow}
          title={homePage.data.eventsHeader.title}
          titleId="marketing-events-heading"
          actionLabel="View all events"
          actionHref={localizePath(ROUTES.events)}
        />

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={featured.slug}
              className="grid grid-cols-1 md:grid-cols-2"
              {...panelMotion}
            >
              <div className="flex min-h-[220px] flex-col justify-center gap-3 bg-muted p-8 md:min-h-[320px]">
                <span className="inline-flex w-fit rounded-full bg-background px-4 py-1 text-xs font-medium shadow-sm">
                  {featured.status}
                </span>
                <p className="text-sm font-medium">{featured.date}</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" aria-hidden />
                  {featured.time}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                  {featured.location}
                </p>
              </div>
              <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                <h3 className="text-lg font-semibold md:text-xl">{featured.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {featured.description}
                </p>
                <Button asChild variant="default" size="sm" className="mt-2 w-fit">
                  <Link to={eventPath(featured.slug, locale)}>
                    View details
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {events.data.map((event, index) => (
            <button
              key={event.slug}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "shrink-0 rounded-lg border px-4 py-3 text-left transition-colors",
                activeIndex === index
                  ? "border-primary bg-muted"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <p className="text-xs text-muted-foreground">{event.date}</p>
              <p className="mt-1 max-w-[200px] truncate text-sm font-medium">
                {event.title}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
