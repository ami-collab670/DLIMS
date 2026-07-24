import type { SupportedLocale } from "@/lib/i18n/locales";

export const cmsQueryKeys = {
  all: ["cms"] as const,
  siteSettings: (locale: SupportedLocale) =>
    [...cmsQueryKeys.all, locale, "site-settings"] as const,
  homePage: (locale: SupportedLocale) =>
    [...cmsQueryKeys.all, locale, "home-page"] as const,
  aboutPage: (locale: SupportedLocale) =>
    [...cmsQueryKeys.all, locale, "about-page"] as const,
  services: (locale: SupportedLocale) =>
    [...cmsQueryKeys.all, locale, "services"] as const,
  service: (locale: SupportedLocale, slug: string) =>
    [...cmsQueryKeys.all, locale, "service", slug] as const,
  news: (locale: SupportedLocale) =>
    [...cmsQueryKeys.all, locale, "news"] as const,
  newsArticle: (locale: SupportedLocale, slug: string) =>
    [...cmsQueryKeys.all, locale, "news-article", slug] as const,
  events: (locale: SupportedLocale) =>
    [...cmsQueryKeys.all, locale, "events"] as const,
  event: (locale: SupportedLocale, slug: string) =>
    [...cmsQueryKeys.all, locale, "event", slug] as const,
  partners: (locale: SupportedLocale) =>
    [...cmsQueryKeys.all, locale, "partners"] as const,
  contactPage: (locale: SupportedLocale, slug: string) =>
    [...cmsQueryKeys.all, locale, "contact-page", slug] as const,
  authPage: (locale: SupportedLocale) =>
    [...cmsQueryKeys.all, locale, "auth-page"] as const,
};
