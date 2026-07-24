import { ArrowRight } from "lucide-react";

import {
  CmsPageSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useHomePage, useNewsArticles } from "@/features/cms/hooks";
import { newsPath } from "@/lib/routing";
import { usePublicLocale } from "@/providers/locale-provider";

import { MarketingPageHero } from "./components/marketing-page-hero";
import { MarketingPageShell } from "./components/marketing-page-shell";
import { MarketingGlowCard } from "./components/motion";
import { MarketingSectionHeader } from "./marketing-section-header";

export function NewsIndexPage() {
  const { locale } = usePublicLocale();
  const homePage = useHomePage();
  const news = useNewsArticles();

  if (homePage.isLoading || news.isLoading) {
    return <CmsPageSkeleton lines={8} />;
  }

  if (
    homePage.isError ||
    news.isError ||
    !homePage.data?.newsPageHeroTitle ||
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

  const home = homePage.data;

  return (
    <div className="flex flex-1 flex-col">
      <MarketingPageHero
        title={home.newsPageHeroTitle!}
        subtitle={home.newsPageHeroSubtitle ?? ""}
      />
      <MarketingPageShell>
        {home.newsIndexHeader ? (
          <MarketingSectionHeader
            eyebrow={home.newsIndexHeader.eyebrow}
            title={home.newsIndexHeader.title}
            titleId="news-index-heading"
          />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.data!.map((item) => (
            <MarketingGlowCard
              key={item.slug}
              to={newsPath(item.slug, locale)}
              className="flex flex-col p-6"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {item.date} · {item.category}
              </span>
              <h3 className="mt-3 text-lg font-semibold group-hover:text-primary">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {item.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                Read more
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </MarketingGlowCard>
          ))}
        </div>
      </MarketingPageShell>
    </div>
  );
}
