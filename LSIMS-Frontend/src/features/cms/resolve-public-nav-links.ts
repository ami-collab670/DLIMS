import type { NavLink } from "@/features/cms/types";
import { localizePath } from "@/lib/i18n/localize-path";
import type { SupportedLocale } from "@/lib/i18n/locales";

type FooterLink = { label: string; href: string };

function localizeInternalHref(href: string, locale: SupportedLocale): string {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return href;
  }

  return localizePath(href, locale);
}

export function resolvePublicNavLinks(
  cmsLinks: NavLink[],
  locale: SupportedLocale,
): NavLink[] {
  return cmsLinks.map((link) => ({
    ...link,
    path: localizeInternalHref(link.path, locale),
  }));
}

export function resolvePublicFooterLinks(
  links: FooterLink[],
  locale: SupportedLocale,
): FooterLink[] {
  return links.map((link) => ({
    ...link,
    href: localizeInternalHref(link.href, locale),
  }));
}
