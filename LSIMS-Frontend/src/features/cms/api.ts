import axios from "axios";

import { cmsClient } from "@/features/cms/client";
import { CmsUnavailableError } from "@/features/cms/cms-errors";
import { mapAboutPage } from "@/features/cms/mappers/about-page";
import { mapContactPage } from "@/features/cms/mappers/contact-page";
import { mapEvent, mapEvents } from "@/features/cms/mappers/event";
import { mapHomePage } from "@/features/cms/mappers/home-page";
import { mapNewsArticle, mapNewsArticles } from "@/features/cms/mappers/news";
import { mapPartners } from "@/features/cms/mappers/partner";
import { mapService, mapServices } from "@/features/cms/mappers/service";
import { mapSiteSettings } from "@/features/cms/mappers/site-settings";
import { resolvePublicNavLinks } from "@/features/cms/resolve-public-nav-links";
import type {
  AboutPageContent,
  ContactPageContent,
  EventItem,
  HomePageContent,
  NewsArticle,
  PartnerItem,
  ServiceItem,
  SiteSettings,
  StrapiAboutPage,
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

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<StrapiSiteSettings>>(
      "/site-setting",
      { params: SITE_SETTING_POPULATE },
    );

    const raw = assertCmsData(data.data, "site-setting");
    const mapped = mapSiteSettings(raw);

    if (!mapped.siteName || !mapped.navLinks.length) {
      throw new CmsUnavailableError("CMS site settings are incomplete");
    }

    return {
      ...mapped,
      navLinks: resolvePublicNavLinks(mapped.navLinks),
    };
  });
}

export async function fetchHomePage(): Promise<HomePageContent> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<StrapiHomePage>>(
      "/home-page",
      { params: HOME_PAGE_POPULATE },
    );

    const raw = assertCmsData(data.data, "home-page");
    const mapped = mapHomePage(raw);

    if (!mapped.heroSlides.length) {
      throw new CmsUnavailableError("CMS home page hero slides are missing");
    }

    return mapped;
  });
}

export async function fetchAboutPage(): Promise<AboutPageContent> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<StrapiAboutPage>>(
      "/about-page",
      { params: ABOUT_PAGE_POPULATE },
    );

    return mapAboutPage(assertCmsData(data.data, "about-page"));
  });
}

export async function fetchServices(): Promise<ServiceItem[]> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiCollectionResponse<StrapiService>>(
      "/services",
      {
        params: {
          status: "published",
          sort: "sortOrder:asc",
          "pagination[pageSize]": 100,
        },
      },
    );

    if (!data.data.length) {
      throw new CmsUnavailableError("CMS services are missing");
    }

    return mapServices(data.data);
  });
}

export async function fetchService(slug: string): Promise<ServiceItem | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<StrapiService>>("/services", {
        params: {
          status: "published",
          "filters[slug][$eq]": slug,
          "pagination[pageSize]": 1,
        },
      }),
    );

    const item = data.data[0];
    return item ? mapService(item) : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<
      StrapiCollectionResponse<StrapiNewsArticle>
    >("/news-articles", {
      params: {
        status: "published",
        sort: "publishedDate:desc",
        "pagination[pageSize]": 100,
      },
    });

    if (!data.data.length) {
      throw new CmsUnavailableError("CMS news articles are missing");
    }

    return mapNewsArticles(data.data);
  });
}

export async function fetchNewsArticle(slug: string): Promise<NewsArticle | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<StrapiNewsArticle>>(
        "/news-articles",
        {
          params: {
            status: "published",
            "filters[slug][$eq]": slug,
            "pagination[pageSize]": 1,
          },
        },
      ),
    );

    const item = data.data[0];
    return item ? mapNewsArticle(item) : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}

export async function fetchEvents(): Promise<EventItem[]> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiCollectionResponse<StrapiEvent>>(
      "/events",
      {
        params: {
          status: "published",
          sort: "date:desc",
          "pagination[pageSize]": 100,
        },
      },
    );

    if (!data.data.length) {
      throw new CmsUnavailableError("CMS events are missing");
    }

    return mapEvents(data.data);
  });
}

export async function fetchEvent(slug: string): Promise<EventItem | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<StrapiEvent>>("/events", {
        params: {
          status: "published",
          "filters[slug][$eq]": slug,
          "pagination[pageSize]": 1,
        },
      }),
    );

    const item = data.data[0];
    return item ? mapEvent(item) : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}

export async function fetchPartners(): Promise<PartnerItem[]> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiCollectionResponse<StrapiPartner>>(
      "/partners",
      {
        params: {
          sort: "sortOrder:asc",
          "pagination[pageSize]": 100,
        },
      },
    );

    if (!data.data.length) {
      throw new CmsUnavailableError("CMS partners are missing");
    }

    return mapPartners(data.data);
  });
}

export async function fetchContactPage(
  slug: string,
): Promise<ContactPageContent | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<StrapiContactPage>>(
        "/contact-pages",
        {
          params: {
            "filters[slug][$eq]": slug,
            "pagination[pageSize]": 1,
            populate: { details: true },
          },
        },
      ),
    );

    const item = data.data[0];
    return item ? mapContactPage(item) : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}
