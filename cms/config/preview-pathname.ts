type PreviewDocument = {
  slug?: string | null;
};

const DEFAULT_PREVIEW_LOCALE = 'en';

function normalizePreviewLocale(locale?: string | null): string {
  if (locale === 'am') {
    return 'am';
  }
  return DEFAULT_PREVIEW_LOCALE;
}

/**
 * Maps Strapi content-type UIDs to locale-prefixed public frontend paths.
 * Return null when the type has no standalone preview page.
 */
export function getPreviewPathname(
  uid: string,
  document: PreviewDocument,
  locale?: string | null,
): string | null {
  const slug = document.slug ?? undefined;
  const prefix = `/${normalizePreviewLocale(locale)}`;

  switch (uid) {
    case 'api::home-page.home-page':
      return prefix;
    case 'api::about-page.about-page':
      return `${prefix}/about`;
    case 'api::service.service':
      return slug ? `${prefix}/services/${slug}` : `${prefix}/services`;
    case 'api::news-article.news-article':
      return slug ? `${prefix}/news/${slug}` : `${prefix}/news`;
    case 'api::event.event':
      return slug ? `${prefix}/events/${slug}` : `${prefix}/events`;
    case 'api::contact-page.contact-page':
      if (slug === 'main' || !slug) {
        return `${prefix}/contact`;
      }
      return `${prefix}/contact/${slug}`;
    case 'api::site-setting.site-setting':
    case 'api::partner.partner':
    case 'api::marketing-page.marketing-page':
      return null;
    default:
      return null;
  }
}
