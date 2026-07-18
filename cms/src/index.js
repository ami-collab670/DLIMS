const PUBLIC_CONTENT_TYPES = [
  'api::site-setting.site-setting',
  'api::home-page.home-page',
  'api::marketing-page.marketing-page',
];

const PUBLIC_ACTIONS = ['find', 'findOne'];

async function enablePublicPermissions(strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) {
    strapi.log.warn('[cms-bootstrap] Public role not found — skipping permission setup');
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
    `[cms-bootstrap] Public permissions: ${created} created, ${existing} already present`
  );

  return { created, existing };
}

function paragraphBlock(text) {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text }],
  };
}

async function seedDefaultContent(strapi) {
  const summary = {
    siteSetting: 'skipped',
    homePage: 'skipped',
    marketingPages: { created: 0, skipped: 0 },
  };

  const siteSetting = await strapi.documents('api::site-setting.site-setting').findFirst();

  if (!siteSetting) {
    await strapi.documents('api::site-setting.site-setting').create({
      data: {
        siteName: 'LSIMS',
        navLinks: [
          { label: 'About', path: '/about' },
          { label: 'Services', path: '/services' },
          { label: 'Contact', path: '/contact' },
        ],
      },
    });
    summary.siteSetting = 'created';
  }

  const homePage = await strapi.documents('api::home-page.home-page').findFirst();

  if (!homePage) {
    await strapi.documents('api::home-page.home-page').create({
      data: {
        heroTitle: 'Laboratory Sample Information Management',
        heroSubtitle:
          'Sign in to access your dashboard. Staff use the workspace with a sidebar; clients get a simple site-style layout.',
        primaryCtaLabel: 'Sign in',
        secondaryCtaLabel: 'Create account',
      },
    });
    summary.homePage = 'created';
  }

  const marketingPages = [
    {
      slug: 'about',
      title: 'About LSIMS',
      intro: 'Learn how LSIMS supports laboratory sample tracking and reporting.',
      body: [
        paragraphBlock(
          'LSIMS is a Laboratory Sample Information Management System designed for ministry laboratories and their clients.'
        ),
        paragraphBlock(
          'Staff manage intake, testing, quality control, and reporting from a unified workspace. External clients submit requests and retrieve results through a dedicated portal.'
        ),
      ],
      seoDescription: 'About the LSIMS laboratory information management platform.',
    },
    {
      slug: 'services',
      title: 'Our Services',
      intro: 'Laboratory testing services available through LSIMS.',
      body: [
        paragraphBlock(
          'Clients can browse the service catalog, submit job requests, and track sample progress from submission through final results.'
        ),
        paragraphBlock(
          'Contact your laboratory administrator for the full list of accredited tests and turnaround times.'
        ),
      ],
      seoDescription: 'Laboratory services available through LSIMS.',
    },
    {
      slug: 'contact',
      title: 'Contact',
      intro: 'Get in touch with the laboratory team.',
      body: [
        paragraphBlock(
          'For account access, sample submissions, or general inquiries, contact your laboratory reception desk during business hours.'
        ),
        paragraphBlock(
          'Existing clients can sign in to submit requests and view results online.'
        ),
      ],
      seoDescription: 'Contact information for LSIMS laboratory services.',
    },
  ];

  for (const page of marketingPages) {
    const existing = await strapi.documents('api::marketing-page.marketing-page').findFirst({
      filters: { slug: page.slug },
    });

    if (!existing) {
      await strapi.documents('api::marketing-page.marketing-page').create({
        data: page,
        status: 'published',
      });
      summary.marketingPages.created += 1;
    } else {
      summary.marketingPages.skipped += 1;
    }
  }

  strapi.log.info(`[cms-bootstrap] Seed summary: ${JSON.stringify(summary)}`);

  return summary;
}

async function verifyPublicContent(strapi) {
  const checks = [
    { label: 'site-setting', uid: 'api::site-setting.site-setting' },
    { label: 'home-page', uid: 'api::home-page.home-page' },
    { label: 'marketing-page (about)', uid: 'api::marketing-page.marketing-page', slug: 'about' },
  ];

  for (const check of checks) {
    const filters = check.slug ? { slug: check.slug } : undefined;
    const doc = await strapi.documents(check.uid).findFirst({ filters });

    if (doc) {
      strapi.log.info(`[cms-bootstrap] Verified ${check.label} content is present`);
    } else {
      strapi.log.warn(`[cms-bootstrap] Missing ${check.label} content after bootstrap`);
    }
  }
}

module.exports = {
  register() {},

  async bootstrap({ strapi }) {
    strapi.log.info('[cms-bootstrap] Starting CMS bootstrap');

    await enablePublicPermissions(strapi);
    await seedDefaultContent(strapi);
    await verifyPublicContent(strapi);

    strapi.log.info('[cms-bootstrap] CMS bootstrap completed');
  },
};
