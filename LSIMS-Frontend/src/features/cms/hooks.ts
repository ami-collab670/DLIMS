import { useQuery } from "@tanstack/react-query";

import {
  fetchAboutPage,
  fetchContactPage,
  fetchEvent,
  fetchEvents,
  fetchHomePage,
  fetchNewsArticle,
  fetchNewsArticles,
  fetchPartners,
  fetchService,
  fetchServices,
  fetchSiteSettings,
} from "@/features/cms/api";
import { CmsUnavailableError } from "@/features/cms/cms-errors";
import { cmsQueryKeys } from "@/features/cms/query-keys";
import { usePublicLocale } from "@/providers/locale-provider";

const CMS_STALE_TIME_MS = import.meta.env.DEV ? 30 * 1000 : 5 * 60 * 1000;

function cmsQueryRetry(failureCount: number, error: unknown) {
  if (error instanceof CmsUnavailableError) {
    return failureCount < 2;
  }

  return false;
}

export function useSiteSettings() {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.siteSettings(locale),
    queryFn: () => fetchSiteSettings(locale),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useHomePage() {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.homePage(locale),
    queryFn: () => fetchHomePage(locale),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useAboutPage() {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.aboutPage(locale),
    queryFn: () => fetchAboutPage(locale),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useServices() {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.services(locale),
    queryFn: () => fetchServices(locale),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useService(slug: string) {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.service(locale, slug),
    queryFn: () => fetchService(locale, slug),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
    enabled: Boolean(slug),
  });
}

export function useNewsArticles() {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.news(locale),
    queryFn: () => fetchNewsArticles(locale),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useNewsArticle(slug: string) {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.newsArticle(locale, slug),
    queryFn: () => fetchNewsArticle(locale, slug),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
    enabled: Boolean(slug),
  });
}

export function useEvents() {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.events(locale),
    queryFn: () => fetchEvents(locale),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useEvent(slug: string) {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.event(locale, slug),
    queryFn: () => fetchEvent(locale, slug),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
    enabled: Boolean(slug),
  });
}

export function usePartners() {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.partners(locale),
    queryFn: () => fetchPartners(locale),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useContactPage(slug: string) {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.contactPage(locale, slug),
    queryFn: () => fetchContactPage(locale, slug),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
    enabled: Boolean(slug),
  });
}

export function useCmsUnavailable() {
  const siteSettings = useSiteSettings();
  const homePage = useHomePage();

  return siteSettings.isError || homePage.isError;
}
