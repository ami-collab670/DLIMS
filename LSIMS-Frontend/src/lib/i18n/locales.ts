export const SUPPORTED_LOCALES = ["en", "am"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export type LocaleOption = {
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "am", label: "Amharic", nativeLabel: "አማርኛ" },
];

export function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function getLocaleOption(code: SupportedLocale): LocaleOption {
  return LOCALE_OPTIONS.find((option) => option.code === code) ?? LOCALE_OPTIONS[0];
}

export const PREFERRED_LOCALE_STORAGE_KEY = "lsims-preferred-locale";

export function getPreferredLocale(): SupportedLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  try {
    const stored = window.localStorage.getItem(PREFERRED_LOCALE_STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage access errors (private mode, blocked storage, etc.)
  }

  return DEFAULT_LOCALE;
}

export function setPreferredLocale(locale: SupportedLocale): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PREFERRED_LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage access errors
  }
}
