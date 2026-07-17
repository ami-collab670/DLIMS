import { cmsClient } from "@/features/cms/client";
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

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const { data } = await cmsClient.get<StrapiSingleResponse<SiteSettings>>(
      "/site-setting",
      {
        params: {
          populate: "navLinks",
        },
      }
    );
    // #region agent log
    fetch('http://127.0.0.1:7840/ingest/133e5be4-3aa4-440f-8689-c818d8f44f13',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'870467'},body:JSON.stringify({sessionId:'870467',location:'cms-api.ts:fetchSiteSettings',message:'CMS site-setting OK',data:{hasData:!!data.data},hypothesisId:'H4',timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
    // #endregion

    if (!data.data) {
      return { ...DEFAULT_SITE_SETTINGS, navLinks: [...DEFAULT_SITE_SETTINGS.navLinks] };
    }

    return {
      siteName: data.data.siteName || DEFAULT_SITE_SETTINGS.siteName,
      navLinks:
        data.data.navLinks?.length > 0
          ? data.data.navLinks
          : [...DEFAULT_SITE_SETTINGS.navLinks],
    };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7840/ingest/133e5be4-3aa4-440f-8689-c818d8f44f13',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'870467'},body:JSON.stringify({sessionId:'870467',location:'cms-api.ts:fetchSiteSettings',message:'CMS site-setting failed',data:{error:String(error)},hypothesisId:'H4',timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
    // #endregion
    return { ...DEFAULT_SITE_SETTINGS, navLinks: [...DEFAULT_SITE_SETTINGS.navLinks] };
  }
}

export async function fetchHomePage(): Promise<HomePageContent> {
  try {
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
  } catch {
    return { ...DEFAULT_HOME_PAGE };
  }
}

export async function fetchMarketingPage(
  slug: string
): Promise<MarketingPageContent | null> {
  try {
    const { data } = await cmsClient.get<
      StrapiCollectionResponse<MarketingPageContent>
    >("/marketing-pages", {
      params: {
        "filters[slug][$eq]": slug,
        status: "published",
      },
    });

    return data.data[0] ?? null;
  } catch {
    return null;
  }
}
