import { useQuery } from "@tanstack/react-query";

import {
  fetchHomePage,
  fetchMarketingPage,
  fetchSiteSettings,
} from "@/features/cms/cms-api";
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

export function useMarketingPage(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.marketingPage(slug),
    queryFn: () => fetchMarketingPage(slug),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useCmsUnavailable() {
  const siteSettings = useSiteSettings();
  const homePage = useHomePage();

  return siteSettings.isError || homePage.isError;
}
