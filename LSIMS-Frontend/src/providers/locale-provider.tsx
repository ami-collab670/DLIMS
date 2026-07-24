import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import { cmsQueryKeys } from "@/features/cms/query-keys";
import { localizePath, resolveLocaleFromPathname } from "@/lib/i18n/localize-path";
import {
  DEFAULT_LOCALE,
  getPreferredLocale,
  isSupportedLocale,
  setPreferredLocale,
  type SupportedLocale,
} from "@/lib/i18n/locales";

type LocaleContextValue = {
  locale: SupportedLocale;
  localizePath: (path: string) => string;
};

type AuthLocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const AuthLocaleContext = createContext<AuthLocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { locale: localeParam } = useParams<{ locale: string }>();
  const queryClient = useQueryClient();

  if (!isSupportedLocale(localeParam)) {
    return <Navigate to={localizePath("/", DEFAULT_LOCALE)} replace />;
  }

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: localeParam,
      localizePath: (path: string) => localizePath(path, localeParam),
    }),
    [localeParam],
  );

  useEffect(() => {
    document.documentElement.lang = localeParam;
    setPreferredLocale(localeParam);
  }, [localeParam]);

  useEffect(() => {
    queryClient.removeQueries({ queryKey: cmsQueryKeys.all });
  }, [localeParam, queryClient]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function LocaleLayout() {
  return (
    <LocaleProvider>
      <Outlet />
    </LocaleProvider>
  );
}

export function AuthLocaleProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [locale, setLocaleState] = useState<SupportedLocale>(() => getPreferredLocale());

  const setLocale = useCallback(
    (nextLocale: SupportedLocale) => {
      setPreferredLocale(nextLocale);
      setLocaleState(nextLocale);
      document.documentElement.lang = nextLocale;
      queryClient.removeQueries({ queryKey: cmsQueryKeys.all });
    },
    [queryClient],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<AuthLocaleContextValue>(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  );

  return (
    <AuthLocaleContext.Provider value={value}>{children}</AuthLocaleContext.Provider>
  );
}

export function useAuthLocale(): AuthLocaleContextValue | null {
  return useContext(AuthLocaleContext);
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function usePublicLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  const authLocale = useContext(AuthLocaleContext);
  const { pathname } = useLocation();

  if (context) {
    return context;
  }

  if (authLocale) {
    return {
      locale: authLocale.locale,
      localizePath: (path: string) => localizePath(path, authLocale.locale),
    };
  }

  const locale = resolveLocaleFromPathname(pathname);
  return {
    locale,
    localizePath: (path: string) => localizePath(path, locale),
  };
}
