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

export type NavLink = {
  id?: number;
  label: string;
  path: string;
};

export type SiteSettings = {
  siteName: string;
  navLinks: NavLink[];
};

export type HomePageContent = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
};

export type MarketingPageContent = {
  slug: string;
  title: string;
  intro: string | null;
  body: StrapiBlock[] | null;
  seoDescription: string | null;
};

type StrapiSingleResponse<T> = {
  data: T | null;
};

type StrapiCollectionResponse<T> = {
  data: T[];
};

export type { StrapiCollectionResponse, StrapiSingleResponse };
