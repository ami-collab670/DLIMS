import type {
  FooterLinkGroup,
  NavLink,
  SiteSettings,
  SocialLink,
  StrapiFooterLinkGroup,
  StrapiNavLink,
  StrapiSiteSettings,
  StrapiSocialLink,
} from "@/features/cms/types";

function mapNavLinks(links: StrapiNavLink[] | null | undefined): NavLink[] {
  if (!links?.length) {
    return [];
  }

  return links
    .filter((link) => link.label && link.path)
    .map((link) => ({ label: link.label, path: link.path }));
}

function mapFooterLinkGroups(
  groups: StrapiFooterLinkGroup[] | null | undefined,
): FooterLinkGroup[] {
  if (!groups?.length) {
    return [];
  }

  return groups
    .filter((group) => group.title && group.links?.length)
    .map((group, index) => ({
      id: `footer-group-${index}`,
      title: group.title,
      links: group.links
        .filter((link) => link.label && link.href)
        .map((link) => ({ label: link.label, href: link.href })),
    }));
}

function mapSocialLinks(
  links: StrapiSocialLink[] | null | undefined,
): SocialLink[] {
  if (!links?.length) {
    return [];
  }

  return links
    .filter((link) => link.label && link.platformId && link.href)
    .map((link) => ({
      label: link.label,
      platformId: link.platformId,
      href: link.href,
    }));
}

export function mapSiteSettings(data: StrapiSiteSettings): SiteSettings {
  return {
    siteName: data.siteName,
    footerTagline: data.footerTagline ?? "",
    navLinks: mapNavLinks(data.navLinks),
    footerLinkGroups: mapFooterLinkGroups(data.footerLinkGroups),
    socialLinks: mapSocialLinks(data.socialLinks),
  };
}
