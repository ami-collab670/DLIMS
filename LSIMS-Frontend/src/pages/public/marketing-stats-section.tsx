import {
  CmsSectionSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useHomePage } from "@/features/cms/hooks";

import { MarketingFadeInView, MarketingGlowCard } from "./components/motion";
import { MarketingSectionHeader } from "./marketing-section-header";

export function MarketingStatsSection() {
  const { data, isLoading, isError, refetch } = useHomePage();

  if (isLoading) {
    return <CmsSectionSkeleton />;
  }

  if (isError || !data?.statsHeader || !data.stats.length) {
    return <CmsUnavailablePanel onRetry={() => void refetch()} />;
  }

  return (
    <section
      aria-labelledby="marketing-stats-heading"
      className="border-y border-border bg-muted/40 py-16 sm:py-20"
    >
      <MarketingFadeInView className="mx-auto max-w-7xl px-4">
        <MarketingSectionHeader
          eyebrow={data.statsHeader.eyebrow}
          title={data.statsHeader.title}
          titleId="marketing-stats-heading"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.stats.map((stat) => (
            <MarketingGlowCard key={stat.label} glowRadius={360} className="p-6">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.context}
              </p>
            </MarketingGlowCard>
          ))}
        </div>
      </MarketingFadeInView>
    </section>
  );
}
