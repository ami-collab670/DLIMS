import { useQuery } from "@tanstack/react-query";

import { AUTH_PAGE_DEFAULTS } from "@/features/cms/auth-defaults";
import { fetchAuthPage } from "@/features/cms/api";
import { CmsUnavailableError } from "@/features/cms/cms-errors";
import { cmsQueryKeys } from "@/features/cms/query-keys";
import type { AuthPageContent } from "@/features/cms/types";
import { usePublicLocale } from "@/providers/locale-provider";

const CMS_STALE_TIME_MS = import.meta.env.DEV ? 30 * 1000 : 5 * 60 * 1000;

function cmsQueryRetry(failureCount: number, error: unknown) {
  if (error instanceof CmsUnavailableError) {
    return failureCount < 2;
  }

  return false;
}

export function useAuthPage() {
  const { locale } = usePublicLocale();

  return useQuery({
    queryKey: cmsQueryKeys.authPage(locale),
    queryFn: () => fetchAuthPage(locale),
    staleTime: CMS_STALE_TIME_MS,
    retry: cmsQueryRetry,
  });
}

export function useAuthPageContent(): AuthPageContent {
  const { data } = useAuthPage();
  return data ?? AUTH_PAGE_DEFAULTS;
}
