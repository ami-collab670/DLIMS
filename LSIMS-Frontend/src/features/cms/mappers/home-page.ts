import { mapSectionHeader } from "@/features/cms/mappers/blocks";
import type {
  HeroSlide,
  HomePageContent,
  ProcessStep,
  StatItem,
  StrapiHeroSlide,
  StrapiHomePage,
  StrapiProcessStep,
  StrapiStatItem,
  StrapiValueProp,
  ValueProp,
} from "@/features/cms/types";

function mapHeroSlide(slide: StrapiHeroSlide): HeroSlide {
  return {
    id: slide.slideKey,
    title: slide.title,
    subtitle: slide.subtitle,
    imageSrc: slide.imageUrl,
    imageAlt: slide.imageAlt,
    gradientFallbackClass: slide.gradientFallbackClass,
    primaryCta:
      slide.primaryCtaLabel && slide.primaryCtaHref
        ? { label: slide.primaryCtaLabel, href: slide.primaryCtaHref }
        : undefined,
    secondaryCta:
      slide.secondaryCtaLabel && slide.secondaryCtaHref
        ? { label: slide.secondaryCtaLabel, href: slide.secondaryCtaHref }
        : undefined,
  };
}

function mapStats(stats: StrapiStatItem[] | null | undefined): StatItem[] {
  if (!stats?.length) {
    return [];
  }

  return stats.map((stat) => ({
    label: stat.label,
    value: stat.value,
    context: stat.context,
  }));
}

function mapProcessSteps(
  steps: StrapiProcessStep[] | null | undefined,
): ProcessStep[] {
  if (!steps?.length) {
    return [];
  }

  return steps.map((step) => ({
    title: step.title,
    description: step.description,
  }));
}

function mapValueProps(
  props: StrapiValueProp[] | null | undefined,
): ValueProp[] {
  if (!props?.length) {
    return [];
  }

  return props.map((prop) => ({
    title: prop.title,
    description: prop.description,
    iconKey: prop.iconKey,
  }));
}

export function mapHomePage(data: StrapiHomePage): HomePageContent {
  return {
    heroSlides: (data.heroSlides ?? []).map(mapHeroSlide),
    stats: mapStats(data.stats),
    servicesHeader: mapSectionHeader(data.servicesHeader),
    statsHeader: mapSectionHeader(data.statsHeader),
    newsHeader: mapSectionHeader(data.newsHeader),
    eventsHeader: mapSectionHeader(data.eventsHeader),
    partnersHeader: mapSectionHeader(data.partnersHeader),
    processSteps: mapProcessSteps(data.processSteps),
    valueProps: mapValueProps(data.valueProps),
    processHeader: mapSectionHeader(data.processHeader),
    valuePropsHeader: mapSectionHeader(data.valuePropsHeader),
    featuredBannerTitle: data.featuredBannerTitle ?? null,
    featuredBannerDescription: data.featuredBannerDescription ?? null,
    featuredBannerCtaLabel: data.featuredBannerCtaLabel ?? null,
    featuredBannerCtaHref: data.featuredBannerCtaHref ?? null,
    servicesPageHeroTitle: data.servicesPageHeroTitle ?? null,
    servicesPageHeroSubtitle: data.servicesPageHeroSubtitle ?? null,
    newsPageHeroTitle: data.newsPageHeroTitle ?? null,
    newsPageHeroSubtitle: data.newsPageHeroSubtitle ?? null,
    eventsPageHeroTitle: data.eventsPageHeroTitle ?? null,
    eventsPageHeroSubtitle: data.eventsPageHeroSubtitle ?? null,
    newsIndexHeader: mapSectionHeader(data.newsIndexHeader),
    eventsIndexHeader: mapSectionHeader(data.eventsIndexHeader),
    servicesMegaMenuEyebrow: data.servicesMegaMenuEyebrow ?? null,
    servicesMegaMenuTitle: data.servicesMegaMenuTitle ?? null,
    servicesMegaMenuDescription: data.servicesMegaMenuDescription ?? null,
  };
}
