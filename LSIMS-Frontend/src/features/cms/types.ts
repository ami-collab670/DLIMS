export type StrapiBlockText = {
  type: "text";
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type StrapiBlock =
  | {
      type: "paragraph" | "heading";
      level?: number;
      children: StrapiBlockText[];
    }
  | {
      type: "list";
      format?: "ordered" | "unordered";
      children: Array<{
        type: "list-item";
        children: StrapiBlockText[];
      }>;
    }
  | {
      type: "link";
      url: string;
      children: StrapiBlockText[];
    };

export type StrapiSectionHeader = {
  eyebrow: string;
  title: string;
};

export type StrapiNavLink = {
  label: string;
  path: string;
};

export type StrapiFooterLink = {
  label: string;
  href: string;
};

export type StrapiFooterLinkGroup = {
  title: string;
  links: StrapiFooterLink[];
};

export type StrapiSocialLink = {
  label: string;
  platformId: string;
  href: string;
};

export type StrapiSiteSettings = {
  siteName: string;
  footerTagline?: string | null;
  navLinks?: StrapiNavLink[] | null;
  footerLinkGroups?: StrapiFooterLinkGroup[] | null;
  socialLinks?: StrapiSocialLink[] | null;
};

export type StrapiHeroSlide = {
  slideKey: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  gradientFallbackClass: string;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
};

export type StrapiStatItem = {
  label: string;
  value: string;
  context: string;
};

export type StrapiProcessStep = {
  title: string;
  description: string;
};

export type StrapiValueProp = {
  title: string;
  description: string;
  iconKey: string;
};

export type StrapiHighlightStat = {
  label: string;
  value: string;
  context: string;
};

export type StrapiMilestone = {
  year: string;
  title: string;
  description: string;
};

export type StrapiAccreditationItem = {
  title: string;
  description: string;
  iconKey: string;
};

export type StrapiHomePage = {
  heroSlides?: StrapiHeroSlide[] | null;
  stats?: StrapiStatItem[] | null;
  servicesHeader?: StrapiSectionHeader | null;
  statsHeader?: StrapiSectionHeader | null;
  newsHeader?: StrapiSectionHeader | null;
  eventsHeader?: StrapiSectionHeader | null;
  partnersHeader?: StrapiSectionHeader | null;
  processSteps?: StrapiProcessStep[] | null;
  valueProps?: StrapiValueProp[] | null;
  processHeader?: StrapiSectionHeader | null;
  valuePropsHeader?: StrapiSectionHeader | null;
  featuredBannerTitle?: string | null;
  featuredBannerDescription?: string | null;
  featuredBannerCtaLabel?: string | null;
  featuredBannerCtaHref?: string | null;
  servicesPageHeroTitle?: string | null;
  servicesPageHeroSubtitle?: string | null;
  newsPageHeroTitle?: string | null;
  newsPageHeroSubtitle?: string | null;
  eventsPageHeroTitle?: string | null;
  eventsPageHeroSubtitle?: string | null;
  newsIndexHeader?: StrapiSectionHeader | null;
  eventsIndexHeader?: StrapiSectionHeader | null;
  servicesMegaMenuEyebrow?: string | null;
  servicesMegaMenuTitle?: string | null;
  servicesMegaMenuDescription?: string | null;
};

export type StrapiAboutPage = {
  heroTitle: string;
  heroSubtitle: string;
  missionTitle: string;
  missionBody: string;
  visionTitle: string;
  visionBody: string;
  highlight?: StrapiHighlightStat | null;
  valuesHeader?: StrapiSectionHeader | null;
  values?: StrapiValueProp[] | null;
  milestonesHeader?: StrapiSectionHeader | null;
  milestones?: StrapiMilestone[] | null;
  accreditationHeader?: StrapiSectionHeader | null;
  accreditation?: StrapiAccreditationItem[] | null;
  partnersHeader?: StrapiSectionHeader | null;
};

export type StrapiService = {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  highlights: string[] | unknown;
  iconKey: string;
  seoDescription?: string | null;
  sortOrder?: number | null;
};

export type StrapiNewsArticle = {
  slug: string;
  title: string;
  description: string;
  publishedDate: string;
  category: string;
  body?: StrapiBlock[] | null;
  seoDescription?: string | null;
};

export type StrapiEvent = {
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  eventStatus: string;
  body?: StrapiBlock[] | null;
};

export type StrapiPartner = {
  partnerKey: string;
  name: string;
  logoUrl: string;
  href?: string | null;
  sortOrder?: number | null;
};

export type StrapiContactDetail = {
  label: string;
  value: string;
};

export type StrapiContactPage = {
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  details?: StrapiContactDetail[] | null;
};

export type NavLink = {
  label: string;
  path: string;
};

export type FooterLinkGroup = {
  id: string;
  title: string;
  links: Array<{ label: string; href: string }>;
};

export type SocialLink = {
  label: string;
  platformId: string;
  href: string;
};

export type SiteSettings = {
  siteName: string;
  footerTagline: string;
  navLinks: NavLink[];
  footerLinkGroups: FooterLinkGroup[];
  socialLinks: SocialLink[];
};

export type SectionHeader = {
  eyebrow: string;
  title: string;
};

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  gradientFallbackClass: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export type StatItem = {
  label: string;
  value: string;
  context: string;
};

export type ProcessStep = {
  title: string;
  description: string;
};

export type ValueProp = {
  title: string;
  description: string;
  iconKey: string;
};

export type HomePageContent = {
  heroSlides: HeroSlide[];
  stats: StatItem[];
  servicesHeader: SectionHeader | null;
  statsHeader: SectionHeader | null;
  newsHeader: SectionHeader | null;
  eventsHeader: SectionHeader | null;
  partnersHeader: SectionHeader | null;
  processSteps: ProcessStep[];
  valueProps: ValueProp[];
  processHeader: SectionHeader | null;
  valuePropsHeader: SectionHeader | null;
  featuredBannerTitle: string | null;
  featuredBannerDescription: string | null;
  featuredBannerCtaLabel: string | null;
  featuredBannerCtaHref: string | null;
  servicesPageHeroTitle: string | null;
  servicesPageHeroSubtitle: string | null;
  newsPageHeroTitle: string | null;
  newsPageHeroSubtitle: string | null;
  eventsPageHeroTitle: string | null;
  eventsPageHeroSubtitle: string | null;
  newsIndexHeader: SectionHeader | null;
  eventsIndexHeader: SectionHeader | null;
  servicesMegaMenuEyebrow: string | null;
  servicesMegaMenuTitle: string | null;
  servicesMegaMenuDescription: string | null;
};

export type AboutHighlight = {
  label: string;
  value: string;
  context: string;
};

export type AboutValue = {
  title: string;
  description: string;
  iconKey: string;
};

export type AboutMilestone = {
  year: string;
  title: string;
  description: string;
};

export type AboutAccreditationItem = {
  title: string;
  description: string;
  iconKey: string;
};

export type AboutPageContent = {
  heroTitle: string;
  heroSubtitle: string;
  missionTitle: string;
  missionBody: string;
  visionTitle: string;
  visionBody: string;
  highlight: AboutHighlight | null;
  valuesHeader: SectionHeader | null;
  values: AboutValue[];
  milestonesHeader: SectionHeader | null;
  milestones: AboutMilestone[];
  accreditationHeader: SectionHeader | null;
  accreditation: AboutAccreditationItem[];
  partnersHeader: SectionHeader | null;
};

export type ServiceItem = {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  highlights: string[];
  iconKey: string;
  href: string;
  seoDescription: string | null;
};

export type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  body: string[];
  href: string;
  seoDescription: string | null;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: string;
  body: string[];
};

export type PartnerItem = {
  id: string;
  name: string;
  logoSrc: string;
  href?: string;
};

export type ContactDetailBlock = {
  label: string;
  value: string;
};

export type ContactPageContent = {
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  details: ContactDetailBlock[];
};

type StrapiSingleResponse<T> = {
  data: T | null;
};

type StrapiCollectionResponse<T> = {
  data: T[];
};

export type { StrapiCollectionResponse, StrapiSingleResponse };
