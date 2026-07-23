import { useCmsUnavailable } from "@/features/cms/hooks";

export function CmsDevFallbackBanner() {
  const cmsUnavailable = useCmsUnavailable();

  if (!import.meta.env.DEV || !cmsUnavailable) {
    return null;
  }

  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-200"
    >
      CMS is unavailable — public marketing content may not render. Check that
      Strapi is running at port 1337.
    </div>
  );
}
