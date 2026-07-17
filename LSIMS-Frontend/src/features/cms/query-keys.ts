export const cmsQueryKeys = {
  all: ["cms"] as const,
  siteSettings: () => [...cmsQueryKeys.all, "site-settings"] as const,
  homePage: () => [...cmsQueryKeys.all, "home-page"] as const,
  marketingPage: (slug: string) =>
    [...cmsQueryKeys.all, "marketing-page", slug] as const,
};
