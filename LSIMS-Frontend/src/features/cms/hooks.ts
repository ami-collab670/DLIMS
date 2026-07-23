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

const CMS_STALE_TIME_MS = import.meta.env.DEV ? 30 * 1000 : 5 * 60 * 1000;

function cmsQueryRetry(failureCount: number, error: unknown) {
  if (error instanceof CmsUnavailableError) {
    return failureCount < 2;
  }

  return false;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: cmsQueryKeys.siteSettings(),
    queryFn: fetchSiteSettings,
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useHomePage() {
  return useQuery({
    queryKey: cmsQueryKeys.homePage(),
    queryFn: fetchHomePage,
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useAboutPage() {
  return useQuery({
    queryKey: cmsQueryKeys.aboutPage(),
    queryFn: fetchAboutPage,
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useServices() {
  return useQuery({
    queryKey: cmsQueryKeys.services(),
    queryFn: fetchServices,
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useService(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.service(slug),
    queryFn: () => fetchService(slug),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
    enabled: Boolean(slug),
  });
}

export function useNewsArticles() {
  return useQuery({
    queryKey: cmsQueryKeys.news(),
    queryFn: fetchNewsArticles,
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.newsArticle(slug),
    queryFn: () => fetchNewsArticle(slug),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
    enabled: Boolean(slug),
  });
}

export function useEvents() {
  return useQuery({
    queryKey: cmsQueryKeys.events(),
    queryFn: fetchEvents,
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.event(slug),
    queryFn: () => fetchEvent(slug),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
    enabled: Boolean(slug),
  });
}

export function usePartners() {
  return useQuery({
    queryKey: cmsQueryKeys.partners(),
    queryFn: fetchPartners,
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useContactPage(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.contactPage(slug),
    queryFn: () => fetchContactPage(slug),
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
