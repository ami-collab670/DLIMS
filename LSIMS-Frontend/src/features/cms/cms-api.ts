import axios from "axios";

import { cmsClient } from "@/features/cms/client";
import { CmsUnavailableError } from "@/features/cms/cms-errors";
import {
  DEFAULT_HOME_PAGE,
  DEFAULT_SITE_SETTINGS,
} from "@/features/cms/defaults";
import type {
  HomePageContent,
  MarketingPageContent,
  SiteSettings,
  StrapiCollectionResponse,
  StrapiSingleResponse,
} from "@/features/cms/types";

const CMS_RETRY_ATTEMPTS = 3;
const CMS_RETRY_DELAY_MS = 500;

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

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<SiteSettings>>(
      "/site-setting",
      {
        params: {
          "populate[navLinks]": true,
        },
      }
    );

    if (!data.data) {
      return {
        ...DEFAULT_SITE_SETTINGS,
        navLinks: [...DEFAULT_SITE_SETTINGS.navLinks],
      };
    }

    return {
      siteName: data.data.siteName || DEFAULT_SITE_SETTINGS.siteName,
      navLinks:
        data.data.navLinks?.length > 0
          ? data.data.navLinks
          : [...DEFAULT_SITE_SETTINGS.navLinks],
    };
  });
}

export async function fetchHomePage(): Promise<HomePageContent> {
  return withCmsRetry(async () => {
    const { data } = await cmsClient.get<StrapiSingleResponse<HomePageContent>>(
      "/home-page"
    );

    if (!data.data) {
      return { ...DEFAULT_HOME_PAGE };
    }

    return {
      heroTitle: data.data.heroTitle || DEFAULT_HOME_PAGE.heroTitle,
      heroSubtitle: data.data.heroSubtitle || DEFAULT_HOME_PAGE.heroSubtitle,
      primaryCtaLabel:
        data.data.primaryCtaLabel || DEFAULT_HOME_PAGE.primaryCtaLabel,
      secondaryCtaLabel:
        data.data.secondaryCtaLabel || DEFAULT_HOME_PAGE.secondaryCtaLabel,
    };
  });
}

// Marketing pages use draft & publish — editors must click Publish after Save.
export async function fetchMarketingPage(
  slug: string
): Promise<MarketingPageContent | null> {
  try {
    const { data } = await withCmsRetry(async () =>
      cmsClient.get<StrapiCollectionResponse<MarketingPageContent>>(
        "/marketing-pages",
        {
          params: {
            "filters[slug][$eq]": slug,
            status: "published",
          },
        }
      )
    );

    return data.data[0] ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toCmsUnavailableError(error);
  }
}
