import { useQuery } from "@tanstack/react-query";

import {
  fetchHomePage,
  fetchMarketingPage,
  fetchSiteSettings,
} from "@/features/cms/cms-api";
import { cmsQueryKeys } from "@/features/cms/query-keys";

const CMS_STALE_TIME_MS = 5 * 60 * 1000;

export function useSiteSettings() {
  return useQuery({
    queryKey: cmsQueryKeys.siteSettings(),
    queryFn: fetchSiteSettings,
    staleTime: CMS_STALE_TIME_MS,
  });
}

export function useHomePage() {
  return useQuery({
    queryKey: cmsQueryKeys.homePage(),
    queryFn: fetchHomePage,
    staleTime: CMS_STALE_TIME_MS,
  });
}

export function useMarketingPage(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.marketingPage(slug),
    queryFn: () => fetchMarketingPage(slug),
    staleTime: CMS_STALE_TIME_MS,
  });
}
