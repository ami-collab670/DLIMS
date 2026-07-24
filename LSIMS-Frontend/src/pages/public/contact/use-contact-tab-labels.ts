import { useQueries } from "@tanstack/react-query";

import { fetchContactPage } from "@/features/cms/api";
import { cmsQueryKeys } from "@/features/cms/query-keys";
import { usePublicLocale } from "@/providers/locale-provider";

const CONTACT_SLUGS = ["main", "collection-points", "careers"] as const;

export function useContactTabLabels() {
  const { locale } = usePublicLocale();
  const queries = useQueries({
    queries: CONTACT_SLUGS.map((slug) => ({
      queryKey: cmsQueryKeys.contactPage(locale, slug),
      queryFn: () => fetchContactPage(locale, slug),
      staleTime: import.meta.env.DEV ? 30 * 1000 : 5 * 60 * 1000,
    })),
  });

  const labels = Object.fromEntries(
    CONTACT_SLUGS.map((slug, index) => [
      slug,
      queries[index]?.data?.heroTitle ?? "",
    ]),
  );

  return {
    labels,
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    refetch: () => {
      queries.forEach((query) => {
        void query.refetch();
      });
    },
  };
}
