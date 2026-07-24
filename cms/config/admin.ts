import type { Core, UID } from '@strapi/strapi';

import { getPreviewPathname } from './preview-pathname';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => {
  const clientUrl = env('CLIENT_URL', 'http://localhost:5173');
  const previewSecret = env('PREVIEW_SECRET', 'devPreviewSecret');

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET')!,
    },
    apiToken: {
      salt: env('API_TOKEN_SALT')!,
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT')!,
      },
    },
    secrets: {
      encryptionKey: env('ENCRYPTION_KEY')!,
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: env.bool('FLAG_PROMOTE_EE', true),
      docLinks: env.bool('FLAG_DOC_LINKS', true),
    },
    preview: {
      enabled: true,
      config: {
        allowedOrigins: [clientUrl, "'self'"],
        async handler(uid, { documentId, locale, status }) {
          const contentTypeUid = uid as UID.ContentType;
          const document = (await strapi.documents(contentTypeUid).findOne({
            documentId,
            locale,
          })) as { slug?: string | null } | null;

          if (!document) {
            return null;
          }

          const pathname = getPreviewPathname(uid, document, locale);

          if (!pathname) {
            return null;
          }

          const resolvedLocale = locale ?? 'en';

          const params = new URLSearchParams({
            url: pathname,
            secret: previewSecret,
            status: status ?? 'published',
            uid,
            locale: resolvedLocale,
          });

          return `${clientUrl}/preview?${params}`;
        },
      },
    },
  };
};

export default config;
