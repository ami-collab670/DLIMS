import axios from "axios";

import { cmsClient } from "@/features/cms/client";
import { CmsUnavailableError } from "@/features/cms/cms-errors";
import { mapAboutPage } from "@/features/cms/mappers/about-page";
import { mapAuthPage } from "@/features/cms/mappers/auth-page";
import { mapContactPage } from "@/features/cms/mappers/contact-page";
import { mapEvent, mapEvents } from "@/features/cms/mappers/event";
import { mapHomePage } from "@/features/cms/mappers/home-page";
import { mapNewsArticle, mapNewsArticles } from "@/features/cms/mappers/news";
import { mapPartners } from "@/features/cms/mappers/partner";
import { mapService, mapServices } from "@/features/cms/mappers/service";
import { mapSiteSettings } from "@/features/cms/mappers/site-settings";
import { getCmsPublicationStatus } from "@/features/cms/preview";
import { resolvePublicFooterLinks, resolvePublicNavLinks } from "@/features/cms/resolve-public-nav-links";
import type { SupportedLocale } from "@/lib/i18n/locales";
import type {
  AboutPageContent,
  AuthPageContent,
  ContactPageContent,
  EventItem,
  HomePageContent,
  NewsArticle,
  PartnerItem,
  ServiceItem,
  SiteSettings,
  StrapiAboutPage,
  StrapiAuthPage,
  StrapiCollectionResponse,
  StrapiContactPage,
  StrapiEvent,
  StrapiHomePage,
  StrapiNewsArticle,
  StrapiPartner,
  StrapiService,
  StrapiSingleResponse,
  StrapiSiteSettings,
} from "@/features/cms/types";

const CMS_RETRY_ATTEMPTS = 3;
const CMS_RETRY_DELAY_MS = 500;

const HOME_PAGE_POPULATE = {
  populate: {
    heroSlides: true,
    stats: true,
    servicesHeader: true,
    statsHeader: true,
    newsHeader: true,
    eventsHeader: true,
    partnersHeader: true,
    processSteps: true,
    valueProps: true,
    processHeader: true,
    valuePropsHeader: true,
    newsIndexHeader: true,
    eventsIndexHeader: true,
  },
};

const SITE_SETTING_POPULATE = {
  populate: {
    navLinks: true,
    footerLinkGroups: { populate: { links: true } },
    socialLinks: true,
  },
};

const ABOUT_PAGE_POPULATE = {
  populate: {
    highlight: true,
    valuesHeader: true,
    values: true,
    milestonesHeader: true,
    milestones: true,
    accreditationHeader: true,
    accreditation: true,
    partnersHeader: true,
  },
};

const AUTH_PAGE_POPULATE = {
  populate: {
    trustBullets: true,
  },
};

function isRetryableCmsError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return true;
  }

  const status = error.response?.status;
  if (!status) {
    return true;
  }

  return status >= 502 && status <= 504;
}

function toCmsUnavailableError(error: unknown): CmsUnavailableError {
  if (error instanceof CmsUnavailableError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status) {
      return new CmsUnavailableError(`CMS request failed with status ${status}`);
    }
    return new CmsUnavailableError("CMS request failed");
  }

  return new CmsUnavailableError("CMS request failed");
}

async function withCmsRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < CMS_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableCmsError(error) || attempt === CMS_RETRY_ATTEMPTS - 1) {
        throw toCmsUnavailableError(error);
      }

      await new Promise((resolve) => {
        setTimeout(resolve, CMS_RETRY_DELAY_MS * (attempt + 1));
      });
    }
  }

  throw toCmsUnavailableError(lastError);
}

function assertCmsData<T>(data: T | null | undefined, label: string): T {
  if (!data) {
    throw new CmsUnavailableError(`CMS content missing: ${label}`);
  }

  return data;
}

function assertResponseLocale(
  raw: object,
  requestedLocale: SupportedLocale,
  label: string,
): void {
  const responseLocale = (raw as { locale?: string | null }).locale;
  if (responseLocale && responseLocale !== requestedLocale) {
    throw new CmsUnavailableError(
      `CMS locale mismatch for ${label}: requested "${requestedLocale}", received "${responseLocale}"`,
    );
  }
}

function assertCollectionLocales(
  items: object[],
  requestedLocale: SupportedLocale,
  label: string,
): void {
  for (const item of items) {
    assertResponseLocale(item, requestedLocale, label);
  }
}

function withLocale(
  locale: SupportedLocale,
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  return { locale, ...params };
}

export async function fetchSiteSettings(locale: SupportedLocale): Promise<SiteSettings> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<StrapiSiteSettings>>(
      "/site-setting",
      { params: withLocale(locale, SITE_SETTING_POPULATE) },
    );

    const raw = assertCmsData(data.data, "site-setting");
    assertResponseLocale(raw, locale, "site-setting");
    const mapped = mapSiteSettings(raw);

    if (!mapped.siteName || !mapped.navLinks.length) {
      throw new CmsUnavailableError("CMS site settings are incomplete");
    }

    return {
      ...mapped,
      navLinks: resolvePublicNavLinks(mapped.navLinks, locale),
      footerLinkGroups: mapped.footerLinkGroups.map((group) => ({
        ...group,
        links: resolvePublicFooterLinks(group.links, locale),
      })),
    };
  });
}

export async function fetchHomePage(locale: SupportedLocale): Promise<HomePageContent> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<StrapiHomePage>>(
      "/home-page",
      { params: withLocale(locale, HOME_PAGE_POPULATE) },
    );

    const raw = assertCmsData(data.data, "home-page");
    assertResponseLocale(raw, locale, "home-page");
    const mapped = mapHomePage(raw);

    if (!mapped.heroSlides.length) {
      throw new CmsUnavailableError("CMS home page hero slides are missing");
    }

    return mapped;
  });
}

export async function fetchAboutPage(locale: SupportedLocale): Promise<AboutPageContent> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<StrapiAboutPage>>(
      "/about-page",
      { params: withLocale(locale, ABOUT_PAGE_POPULATE) },
    );

    const raw = assertCmsData(data.data, "about-page");
    assertResponseLocale(raw, locale, "about-page");
    return mapAboutPage(raw);
  });
}

export async function fetchServices(locale: SupportedLocale): Promise<ServiceItem[]> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiCollectionResponse<StrapiService>>(
      "/services",
      {
        params: withLocale(locale, {
          status: getCmsPublicationStatus(),
          sort: "sortOrder:asc",
          "pagination[pageSize]": 100,
        }),
      },
    );

    if (!data.data.length) {
      throw new CmsUnavailableError("CMS services are missing");
    }

    assertCollectionLocales(data.data, locale, "services");
    return mapServices(data.data, locale);
  });
}

export async function fetchService(
  locale: SupportedLocale,
  slug: string,
): Promise<ServiceItem | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<StrapiService>>("/services", {
        params: withLocale(locale, {
          status: getCmsPublicationStatus(),
          "filters[slug][$eq]": slug,
          "pagination[pageSize]": 1,
        }),
      }),
    );

    const item = data.data[0];
    if (item) {
      assertResponseLocale(item, locale, "service");
    }
    return item ? mapService(item, locale) : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}

export async function fetchNewsArticles(locale: SupportedLocale): Promise<NewsArticle[]> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<
      StrapiCollectionResponse<StrapiNewsArticle>
    >("/news-articles", {
      params: withLocale(locale, {
        status: getCmsPublicationStatus(),
        sort: "publishedDate:desc",
        "pagination[pageSize]": 100,
      }),
    });

    if (!data.data.length) {
      throw new CmsUnavailableError("CMS news articles are missing");
    }

    assertCollectionLocales(data.data, locale, "news-articles");
    return mapNewsArticles(data.data, locale);
  });
}

export async function fetchNewsArticle(
  locale: SupportedLocale,
  slug: string,
): Promise<NewsArticle | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<StrapiNewsArticle>>(
        "/news-articles",
        {
          params: withLocale(locale, {
            status: getCmsPublicationStatus(),
            "filters[slug][$eq]": slug,
            "pagination[pageSize]": 1,
          }),
        },
      ),
    );

    const item = data.data[0];
    if (item) {
      assertResponseLocale(item, locale, "news-article");
    }
    return item ? mapNewsArticle(item, locale) : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}

export async function fetchEvents(locale: SupportedLocale): Promise<EventItem[]> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiCollectionResponse<StrapiEvent>>(
      "/events",
      {
        params: withLocale(locale, {
          status: getCmsPublicationStatus(),
          sort: "date:desc",
          "pagination[pageSize]": 100,
        }),
      },
    );

    if (!data.data.length) {
      throw new CmsUnavailableError("CMS events are missing");
    }

    assertCollectionLocales(data.data, locale, "events");
    return mapEvents(data.data);
  });
}

export async function fetchEvent(
  locale: SupportedLocale,
  slug: string,
): Promise<EventItem | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<StrapiEvent>>("/events", {
        params: withLocale(locale, {
          status: getCmsPublicationStatus(),
          "filters[slug][$eq]": slug,
          "pagination[pageSize]": 1,
        }),
      }),
    );

    const item = data.data[0];
    if (item) {
      assertResponseLocale(item, locale, "event");
    }
    return item ? mapEvent(item) : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}

export async function fetchPartners(locale: SupportedLocale): Promise<PartnerItem[]> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiCollectionResponse<StrapiPartner>>(
      "/partners",
      {
        params: withLocale(locale, {
          sort: "sortOrder:asc",
          "pagination[pageSize]": 100,
        }),
      },
    );

    if (!data.data.length) {
      throw new CmsUnavailableError("CMS partners are missing");
    }

    assertCollectionLocales(data.data, locale, "partners");
    return mapPartners(data.data);
  });
}

export async function fetchContactPage(
  locale: SupportedLocale,
  slug: string,
): Promise<ContactPageContent | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<StrapiContactPage>>(
        "/contact-pages",
        {
          params: withLocale(locale, {
            "filters[slug][$eq]": slug,
            "pagination[pageSize]": 1,
            populate: { details: true },
          }),
        },
      ),
    );

    const item = data.data[0];
    if (item) {
      assertResponseLocale(item, locale, "contact-page");
    }
    return item ? mapContactPage(item) : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}

export async function fetchAuthPage(locale: SupportedLocale): Promise<AuthPageContent> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<StrapiAuthPage>>(
      "/auth-page",
      { params: withLocale(locale, AUTH_PAGE_POPULATE) },
    );

    const raw = assertCmsData(data.data, "auth-page");
    assertResponseLocale(raw, locale, "auth-page");
    return mapAuthPage(raw);
  });
}
