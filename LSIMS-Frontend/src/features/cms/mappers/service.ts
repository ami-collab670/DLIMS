import { servicePath } from "@/lib/routing/path-builders";
import type { SupportedLocale } from "@/lib/i18n/locales";

import type { ServiceItem, StrapiService } from "@/features/cms/types";

export function mapService(data: StrapiService, locale: SupportedLocale): ServiceItem {
  const highlights = Array.isArray(data.highlights)
    ? data.highlights.filter((item): item is string => typeof item === "string")
    : [];

  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    longDescription: data.longDescription,
    highlights,
    iconKey: data.iconKey,
    href: servicePath(data.slug, locale),
    seoDescription: data.seoDescription ?? null,
  };
}

export function mapServices(
  items: StrapiService[],
  locale: SupportedLocale,
): ServiceItem[] {
  return items.map((item) => mapService(item, locale));
}
