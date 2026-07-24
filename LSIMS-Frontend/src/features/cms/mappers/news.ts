import { blocksToParagraphs } from "@/features/cms/mappers/blocks";
import { newsPath } from "@/lib/routing/path-builders";
import type { SupportedLocale } from "@/lib/i18n/locales";

import type { NewsArticle, StrapiNewsArticle } from "@/features/cms/types";

export function mapNewsArticle(
  data: StrapiNewsArticle,
  locale: SupportedLocale,
): NewsArticle {
  return {
    id: data.slug,
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: data.publishedDate,
    category: data.category,
    body: blocksToParagraphs(data.body),
    href: newsPath(data.slug, locale),
    seoDescription: data.seoDescription ?? null,
  };
}

export function mapNewsArticles(
  items: StrapiNewsArticle[],
  locale: SupportedLocale,
): NewsArticle[] {
  return items.map((item) => mapNewsArticle(item, locale));
}
