import { servicePath } from "@/lib/routing/path-builders";

import type { ServiceItem, StrapiService } from "@/features/cms/types";

export function mapService(data: StrapiService): ServiceItem {
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
    href: servicePath(data.slug),
    seoDescription: data.seoDescription ?? null,
  };
}

export function mapServices(items: StrapiService[]): ServiceItem[] {
  return items.map(mapService);
}
