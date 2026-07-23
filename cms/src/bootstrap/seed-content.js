const {
  SITE_SETTING_DATA,
  HOME_PAGE_DATA,
  ABOUT_PAGE_DATA,
  SERVICES,
  NEWS_ARTICLES,
  EVENTS,
  PARTNERS,
  CONTACT_PAGES,
} = require('./seed-data');

const PUBLIC_CONTENT_TYPES = [
  'api::site-setting.site-setting',
  'api::home-page.home-page',
  'api::about-page.about-page',
  'api::service.service',
  'api::news-article.news-article',
  'api::event.event',
  'api::partner.partner',
  'api::contact-page.contact-page',
  'api::marketing-page.marketing-page',
];

const PUBLIC_ACTIONS = ['find', 'findOne'];

const PUBLISHABLE_UIDS = new Set([
  'api::service.service',
  'api::news-article.news-article',
  'api::event.event',
]);

function logPrefix(strapi) {
  return strapi.log?.info ? '[cms-seed]' : '[cms-seed]';
}

async function enablePublicPermissions(strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) {
    strapi.log.warn(`${logPrefix(strapi)} Public role not found — skipping permission setup`);
    return { created: 0, existing: 0 };
  }

  let created = 0;
  let existing = 0;

  for (const uid of PUBLIC_CONTENT_TYPES) {
    for (const action of PUBLIC_ACTIONS) {
      const permissionAction = `${uid}.${action}`;
      const found = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: {
          action: permissionAction,
          role: publicRole.id,
        },
      });

      if (!found) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: {
            action: permissionAction,
            role: publicRole.id,
          },
        });
        created += 1;
      } else {
        existing += 1;
      }
    }
  }

  strapi.log.info(
    `${logPrefix(strapi)} Public permissions: ${created} created, ${existing} already present`
  );

  return { created, existing };
}

async function upsertSingleType(strapi, uid, data, summaryKey, summary) {
  const existing = await strapi.documents(uid).findFirst();

  if (!existing) {
    await strapi.documents(uid).create({ data });
    summary[summaryKey] = 'created';
    return;
  }

  await strapi.documents(uid).update({
    documentId: existing.documentId,
    data,
  });
  summary[summaryKey] = 'updated';
}

async function upsertCollectionItem(strapi, uid, item, filterField, filterValue) {
  const existing = await strapi.documents(uid).findFirst({
    filters: { [filterField]: filterValue },
  });

  const publishable = PUBLISHABLE_UIDS.has(uid);
  const publishOptions = publishable ? { status: 'published' } : {};

  if (!existing) {
    await strapi.documents(uid).create({
      data: item,
      ...publishOptions,
    });
    return 'created';
  }

  await strapi.documents(uid).update({
    documentId: existing.documentId,
    data: item,
    ...publishOptions,
  });
  return 'updated';
}

async function upsertCollectionByField(strapi, uid, items, filterField, summaryKey, summary) {
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const filterValue = item[filterField];
    const result = await upsertCollectionItem(strapi, uid, item, filterField, filterValue);

    if (result === 'created') {
      created += 1;
    } else {
      updated += 1;
    }
  }

  summary[summaryKey] = { created, updated };
}

async function upsertPartners(strapi, summary) {
  let created = 0;
  let updated = 0;

  for (const partner of PARTNERS) {
    const result = await upsertCollectionItem(
      strapi,
      'api::partner.partner',
      partner,
      'partnerKey',
      partner.partnerKey
    );

    if (result === 'created') {
      created += 1;
    } else {
      updated += 1;
    }
  }

  summary.partners = { created, updated };
}

async function seedContent(strapi) {
  const summary = {
    siteSetting: 'pending',
    homePage: 'pending',
    aboutPage: 'pending',
    services: { created: 0, updated: 0 },
    newsArticles: { created: 0, updated: 0 },
    events: { created: 0, updated: 0 },
    partners: { created: 0, updated: 0 },
    contactPages: { created: 0, updated: 0 },
  };

  await upsertSingleType(
    strapi,
    'api::site-setting.site-setting',
    SITE_SETTING_DATA,
    'siteSetting',
    summary
  );

  await upsertSingleType(strapi, 'api::home-page.home-page', HOME_PAGE_DATA, 'homePage', summary);

  await upsertSingleType(
    strapi,
    'api::about-page.about-page',
    ABOUT_PAGE_DATA,
    'aboutPage',
    summary
  );

  await upsertCollectionByField(
    strapi,
    'api::service.service',
    SERVICES,
    'slug',
    'services',
    summary
  );

  await upsertCollectionByField(
    strapi,
    'api::news-article.news-article',
    NEWS_ARTICLES,
    'slug',
    'newsArticles',
    summary
  );

  await upsertCollectionByField(
    strapi,
    'api::event.event',
    EVENTS,
    'slug',
    'events',
    summary
  );

  await upsertPartners(strapi, summary);

  await upsertCollectionByField(
    strapi,
    'api::contact-page.contact-page',
    CONTACT_PAGES,
    'slug',
    'contactPages',
    summary
  );

  strapi.log.info(`${logPrefix(strapi)} Seed summary: ${JSON.stringify(summary)}`);

  return summary;
}

async function verifyPublicContent(strapi) {
  const checks = [
    { label: 'site-setting', uid: 'api::site-setting.site-setting' },
    { label: 'home-page', uid: 'api::home-page.home-page' },
    { label: 'about-page', uid: 'api::about-page.about-page' },
    { label: 'service', uid: 'api::service.service' },
    { label: 'news-article', uid: 'api::news-article.news-article' },
    { label: 'event', uid: 'api::event.event' },
    { label: 'partner', uid: 'api::partner.partner' },
    { label: 'contact-page (main)', uid: 'api::contact-page.contact-page', slug: 'main' },
  ];

  for (const check of checks) {
    const filters = check.slug ? { slug: check.slug } : undefined;
    const doc = await strapi.documents(check.uid).findFirst({ filters });

    if (doc) {
      strapi.log.info(`${logPrefix(strapi)} Verified ${check.label} content is present`);
    } else {
      strapi.log.warn(`${logPrefix(strapi)} Missing ${check.label} content after seed`);
    }
  }
}

module.exports = {
  enablePublicPermissions,
  seedContent,
  verifyPublicContent,
};
