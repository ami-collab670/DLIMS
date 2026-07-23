export const cmsQueryKeys = {
  all: ["cms"] as const,
  siteSettings: () => [...cmsQueryKeys.all, "site-settings"] as const,
  homePage: () => [...cmsQueryKeys.all, "home-page"] as const,
  aboutPage: () => [...cmsQueryKeys.all, "about-page"] as const,
  services: () => [...cmsQueryKeys.all, "services"] as const,
  service: (slug: string) => [...cmsQueryKeys.all, "service", slug] as const,
  news: () => [...cmsQueryKeys.all, "news"] as const,
  newsArticle: (slug: string) =>
    [...cmsQueryKeys.all, "news-article", slug] as const,
  events: () => [...cmsQueryKeys.all, "events"] as const,
  event: (slug: string) => [...cmsQueryKeys.all, "event", slug] as const,
  partners: () => [...cmsQueryKeys.all, "partners"] as const,
  contactPage: (slug: string) =>
    [...cmsQueryKeys.all, "contact-page", slug] as const,
};
