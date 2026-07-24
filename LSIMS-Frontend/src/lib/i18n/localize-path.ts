import {
  getPreferredLocale,
  isSupportedLocale,
  type SupportedLocale,
} from "@/lib/i18n/locales";

export function stripLocalePrefix(pathname: string): {
  locale: SupportedLocale | null;
  pathnameWithoutLocale: string;
} {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { locale: null, pathnameWithoutLocale: "/" };
  }

  const maybeLocale = segments[0];
  if (!isSupportedLocale(maybeLocale)) {
    return { locale: null, pathnameWithoutLocale: pathname };
  }

  const rest = segments.slice(1).join("/");
  return {
    locale: maybeLocale,
    pathnameWithoutLocale: rest ? `/${rest}` : "/",
  };
}

export function localizePath(path: string, locale: SupportedLocale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (normalized === "/") {
    return `/${locale}`;
  }

  const { pathnameWithoutLocale } = stripLocalePrefix(normalized);
  const suffix =
    pathnameWithoutLocale === "/" ? "" : pathnameWithoutLocale;

  return `/${locale}${suffix}`;
}

export function switchLocaleInPathname(
  pathname: string,
  nextLocale: SupportedLocale,
): string {
  const { pathnameWithoutLocale } = stripLocalePrefix(pathname);
  return localizePath(pathnameWithoutLocale, nextLocale);
}

export function resolveLocaleFromPathname(pathname: string): SupportedLocale {
  const { locale } = stripLocalePrefix(pathname);
  return locale ?? getPreferredLocale();
}

export function withLocalePrefix(
  locale: SupportedLocale,
  localeNeutralPath: string,
): string {
  return localizePath(localeNeutralPath, locale);
}
