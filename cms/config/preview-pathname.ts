type PreviewDocument = {
  slug?: string | null;
};

/**
 * Maps Strapi content-type UIDs to public frontend paths.
 * Return null when the type has no standalone preview page.
 */
export function getPreviewPathname(
  uid: string,
  document: PreviewDocument,
): string | null {
  const slug = document.slug ?? undefined;

  switch (uid) {
    case 'api::home-page.home-page':
      return '/';
    case 'api::about-page.about-page':
      return '/about';
    case 'api::service.service':
      return slug ? `/services/${slug}` : '/services';
    case 'api::news-article.news-article':
      return slug ? `/news/${slug}` : '/news';
    case 'api::event.event':
      return slug ? `/events/${slug}` : '/events';
    case 'api::contact-page.contact-page':
      if (slug === 'main' || !slug) {
        return '/contact';
      }
      return `/contact/${slug}`;
    case 'api::site-setting.site-setting':
    case 'api::partner.partner':
    case 'api::marketing-page.marketing-page':
      return null;
    default:
      return null;
  }
}
