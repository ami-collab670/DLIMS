const en = require('./seed-data');
const am = require('./seed-data.am');
const { DEFAULT_LOCALE, AMHARIC_LOCALE } = require('./ensure-locales');

const LOCALES = [DEFAULT_LOCALE, AMHARIC_LOCALE];

const LOCALE_BUNDLES = {
  [DEFAULT_LOCALE]: en,
  [AMHARIC_LOCALE]: am,
};

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
  'api::auth-page.auth-page',
];

const PUBLIC_ACTIONS = ['find', 'findOne'];

const PUBLISHABLE_UIDS = new Set([
  'api::service.service',
  'api::news-article.news-article',
  'api::event.event',
]);

function logPrefix() {
  return '[cms-seed]';
}

async function enablePublicPermissions(strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) {
    strapi.log.warn(`${logPrefix()} Public role not found — skipping permission setup`);
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
    `${logPrefix()} Public permissions: ${created} created, ${existing} already present`
  );

  return { created, existing };
}

async function upsertSingleType(strapi, uid, data, locale) {
  const existing = await strapi.documents(uid).findFirst({ locale, status: 'published' });

  if (existing) {
    await strapi.documents(uid).update({
      documentId: existing.documentId,
      locale,
      data,
      status: 'published',
    });
    return 'updated';
  }

  if (locale === DEFAULT_LOCALE) {
    await strapi.documents(uid).create({ data, locale, status: 'published' });
    return 'created';
  }

  const base = await strapi.documents(uid).findFirst({ locale: DEFAULT_LOCALE, status: 'published' });
  if (!base) {
    return 'skipped';
  }

  await strapi.documents(uid).update({
    documentId: base.documentId,
    locale,
    data,
    status: 'published',
  });
  return 'created';
}

async function upsertCollectionItem(strapi, uid, item, filterField, filterValue, locale) {
  const publishable = PUBLISHABLE_UIDS.has(uid);
  const publishOptions = publishable ? { status: 'published' } : {};

  const existing = await strapi.documents(uid).findFirst({
    filters: { [filterField]: filterValue },
    locale,
  });

  if (existing) {
    await strapi.documents(uid).update({
      documentId: existing.documentId,
      locale,
      data: item,
      ...publishOptions,
    });
    return 'updated';
  }

  if (locale === DEFAULT_LOCALE) {
    await strapi.documents(uid).create({
      data: item,
      locale,
      ...publishOptions,
    });
    return 'created';
  }

  const base = await strapi.documents(uid).findFirst({
    filters: { [filterField]: filterValue },
    locale: DEFAULT_LOCALE,
  });

  if (!base) {
    return 'skipped';
  }

  await strapi.documents(uid).update({
    documentId: base.documentId,
    locale,
    data: item,
    ...publishOptions,
  });
  return 'created';
}

async function upsertCollectionByField(strapi, uid, items, filterField, locale) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const result = await upsertCollectionItem(
      strapi,
      uid,
      item,
      filterField,
      item[filterField],
      locale
    );

    if (result === 'created') created += 1;
    else if (result === 'updated') updated += 1;
    else skipped += 1;
  }

  return { created, updated, skipped };
}

async function seedContent(strapi) {
  const summary = { locales: {} };

  for (const locale of LOCALES) {
    const bundle = LOCALE_BUNDLES[locale];
    const localeSummary = {
      siteSetting: 'pending',
      homePage: 'pending',
      aboutPage: 'pending',
      services: { created: 0, updated: 0, skipped: 0 },
      newsArticles: { created: 0, updated: 0, skipped: 0 },
      events: { created: 0, updated: 0, skipped: 0 },
      partners: { created: 0, updated: 0, skipped: 0 },
      contactPages: { created: 0, updated: 0, skipped: 0 },
    };

    localeSummary.siteSetting = await upsertSingleType(
      strapi,
      'api::site-setting.site-setting',
      bundle.SITE_SETTING_DATA,
      locale
    );

    localeSummary.homePage = await upsertSingleType(
      strapi,
      'api::home-page.home-page',
      bundle.HOME_PAGE_DATA,
      locale
    );

    localeSummary.aboutPage = await upsertSingleType(
      strapi,
      'api::about-page.about-page',
      bundle.ABOUT_PAGE_DATA,
      locale
    );

    localeSummary.authPage = await upsertSingleType(
      strapi,
      'api::auth-page.auth-page',
      bundle.AUTH_PAGE_DATA,
      locale
    );

    localeSummary.services = await upsertCollectionByField(
      strapi,
      'api::service.service',
      bundle.SERVICES,
      'slug',
      locale
    );

    localeSummary.newsArticles = await upsertCollectionByField(
      strapi,
      'api::news-article.news-article',
      bundle.NEWS_ARTICLES,
      'slug',
      locale
    );

    localeSummary.events = await upsertCollectionByField(
      strapi,
      'api::event.event',
      bundle.EVENTS,
      'slug',
      locale
    );

    localeSummary.partners = await upsertCollectionByField(
      strapi,
      'api::partner.partner',
      bundle.PARTNERS,
      'partnerKey',
      locale
    );

    localeSummary.contactPages = await upsertCollectionByField(
      strapi,
      'api::contact-page.contact-page',
      bundle.CONTACT_PAGES,
      'slug',
      locale
    );

    summary.locales[locale] = localeSummary;
  }

  strapi.log.info(`${logPrefix()} Seed summary: ${JSON.stringify(summary)}`);

  return summary;
}

const LOCALE_SENTINELS = {
  [DEFAULT_LOCALE]: {
    navFirstLabel: 'Home',
    heroTitleIncludes: 'Accredited',
  },
  [AMHARIC_LOCALE]: {
    navFirstLabel: 'መነሻ',
    heroTitleIncludes: null,
    heroTitleExcludes: 'Accredited',
  },
};

async function fetchSiteSettingDoc(strapi, locale) {
  return strapi.documents('api::site-setting.site-setting').findFirst({
    locale,
    status: 'published',
    populate: { navLinks: true },
  });
}

async function fetchHomePageDoc(strapi, locale) {
  return strapi.documents('api::home-page.home-page').findFirst({
    locale,
    status: 'published',
    populate: { heroSlides: true },
  });
}

async function verifyLocaleSentinels(strapi, locale) {
  const sentinels = LOCALE_SENTINELS[locale];
  let failed = false;

  const siteSetting = await fetchSiteSettingDoc(strapi, locale);
  const navLabel = siteSetting?.navLinks?.[0]?.label;

  if (navLabel !== sentinels.navFirstLabel) {
    strapi.log.error(
      `${logPrefix()} Locale sentinel failed for site-setting (${locale}): expected navLinks[0].label "${sentinels.navFirstLabel}", got "${navLabel ?? '(missing)'}"`
    );
    failed = true;
  }

  const homePage = await fetchHomePageDoc(strapi, locale);
  const heroTitle = homePage?.heroSlides?.[0]?.title ?? '';

  if (sentinels.heroTitleIncludes && !heroTitle.includes(sentinels.heroTitleIncludes)) {
    strapi.log.error(
      `${logPrefix()} Locale sentinel failed for home-page (${locale}): heroSlides[0].title should include "${sentinels.heroTitleIncludes}", got "${heroTitle || '(missing)'}"`
    );
    failed = true;
  }

  if (sentinels.heroTitleExcludes && heroTitle.includes(sentinels.heroTitleExcludes)) {
    strapi.log.error(
      `${logPrefix()} Locale sentinel failed for home-page (${locale}): heroSlides[0].title must not include "${sentinels.heroTitleExcludes}", got "${heroTitle || '(missing)'}"`
    );
    failed = true;
  }

  if (!failed) {
    strapi.log.info(
      `${logPrefix()} Locale sentinels passed for ${locale} (nav="${navLabel}", hero="${heroTitle.slice(0, 40)}…")`
    );
  }

  return !failed;
}

async function repairLocaleContent(strapi, locale) {
  const bundle = LOCALE_BUNDLES[locale];
  strapi.log.warn(`${logPrefix()} Re-seeding ${locale} content after sentinel failure`);

  await upsertSingleType(strapi, 'api::site-setting.site-setting', bundle.SITE_SETTING_DATA, locale);
  await upsertSingleType(strapi, 'api::home-page.home-page', bundle.HOME_PAGE_DATA, locale);
  await upsertSingleType(strapi, 'api::about-page.about-page', bundle.ABOUT_PAGE_DATA, locale);
  await upsertSingleType(strapi, 'api::auth-page.auth-page', bundle.AUTH_PAGE_DATA, locale);
  await upsertCollectionByField(strapi, 'api::service.service', bundle.SERVICES, 'slug', locale);
  await upsertCollectionByField(
    strapi,
    'api::news-article.news-article',
    bundle.NEWS_ARTICLES,
    'slug',
    locale
  );
  await upsertCollectionByField(strapi, 'api::event.event', bundle.EVENTS, 'slug', locale);
  await upsertCollectionByField(strapi, 'api::partner.partner', bundle.PARTNERS, 'partnerKey', locale);
  await upsertCollectionByField(
    strapi,
    'api::contact-page.contact-page',
    bundle.CONTACT_PAGES,
    'slug',
    locale
  );
}
async function verifyAndRepairLocales(strapi) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const failures = [];

    for (const locale of LOCALES) {
      const passed = await verifyLocaleSentinels(strapi, locale);
      if (!passed) {
        failures.push(locale);
      }
    }

    if (failures.length === 0) {
      return true;
    }

    strapi.log.warn(
      `${logPrefix()} Locale repair attempt ${attempt}/${maxAttempts} for: ${failures.join(', ')}`
    );

    for (const locale of failures) {
      await repairLocaleContent(strapi, locale);
    }
  }

  let allPassed = true;
  for (const locale of LOCALES) {
    const passed = await verifyLocaleSentinels(strapi, locale);
    if (!passed) {
      allPassed = false;
      strapi.log.error(
        `${logPrefix()} Locale content for "${locale}" is still incorrect after ${maxAttempts} repair attempts — check seed data and Strapi i18n settings`
      );
    }
  }

  return allPassed;
}

async function verifyPublicContent(strapi) {
  await verifyAndRepairLocales(strapi);

  const checks = [
    { label: 'site-setting', uid: 'api::site-setting.site-setting' },
    { label: 'home-page', uid: 'api::home-page.home-page' },
    { label: 'about-page', uid: 'api::about-page.about-page' },
    { label: 'auth-page', uid: 'api::auth-page.auth-page' },
    { label: 'service', uid: 'api::service.service' },
    { label: 'news-article', uid: 'api::news-article.news-article' },
    { label: 'event', uid: 'api::event.event' },
    { label: 'partner', uid: 'api::partner.partner' },
    { label: 'contact-page (main)', uid: 'api::contact-page.contact-page', slug: 'main' },
  ];

  for (const locale of LOCALES) {
    for (const check of checks) {
      const filters = check.slug ? { slug: check.slug } : undefined;
      const doc = await strapi.documents(check.uid).findFirst({ filters, locale });

      if (doc) {
        strapi.log.info(
          `${logPrefix()} Verified ${check.label} (${locale}) content is present`
        );
      } else {
        strapi.log.warn(
          `${logPrefix()} Missing ${check.label} (${locale}) content after seed`
        );
      }
    }
  }
}

module.exports = {
  enablePublicPermissions,
  seedContent,
  verifyPublicContent,
};
