import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  CmsSectionSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useHomePage, useNewsArticles } from "@/features/cms/hooks";
import { ROUTES, newsPath } from "@/lib/routing";
import { usePublicLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/ui";

import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
  usePrefersReducedMotion,
} from "./components/motion";
import { MarketingSectionHeader } from "./marketing-section-header";

export function MarketingNewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { locale, localizePath } = usePublicLocale();
  const homePage = useHomePage();
  const news = useNewsArticles();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (homePage.isLoading || news.isLoading) {
    return <CmsSectionSkeleton />;
  }

  if (
    homePage.isError ||
    news.isError ||
    !homePage.data?.newsHeader ||
    !news.data?.length
  ) {
    return (
      <CmsUnavailablePanel
        onRetry={() => {
          void homePage.refetch();
          void news.refetch();
        }}
      />
    );
  }

  const featured = news.data[activeIndex] ?? news.data[0];

  const panelMotion = prefersReducedMotion
    ? {}
    : {
        initial: { ...fadeUpHidden, y: 8 },
        animate: fadeUpVisible,
        exit: { ...fadeUpHidden, y: 8 },
        transition: fadeUpTransition(),
      };

  return (
    <section
      id="news"
      aria-labelledby="marketing-news-heading"
      className="bg-background py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4">
        <MarketingSectionHeader
          eyebrow={homePage.data.newsHeader.eyebrow}
          title={homePage.data.newsHeader.title}
          titleId="marketing-news-heading"
          actionLabel="View all news"
          actionHref={localizePath(ROUTES.news)}
        />

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={featured.id}
              className="grid grid-cols-1 md:grid-cols-2"
              {...panelMotion}
            >
              <div className="flex min-h-[220px] items-center justify-center bg-muted p-8 md:min-h-[320px]">
                <div className="text-center">
                  <span className="inline-flex rounded-full bg-background px-4 py-1 text-xs font-medium shadow-sm">
                    {featured.date}
                  </span>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {featured.category}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                <h3 className="text-lg font-semibold md:text-xl">{featured.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {featured.description}
                </p>
                <Button asChild variant="default" size="sm" className="mt-2 w-fit">
                  <Link to={newsPath(featured.slug, locale)}>
                    Read more
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {news.data.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "shrink-0 rounded-lg border px-4 py-3 text-left transition-colors",
                activeIndex === index
                  ? "border-primary bg-muted"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <p className="text-xs text-muted-foreground">{item.date}</p>
              <p className="mt-1 max-w-[200px] truncate text-sm font-medium">
                {item.title}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
