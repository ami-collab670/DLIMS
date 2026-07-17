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
    return;
  }

  for (const uid of PUBLIC_CONTENT_TYPES) {
    for (const action of PUBLIC_ACTIONS) {
      const permissionAction = `${uid}.${action}`;
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: {
          action: permissionAction,
          role: publicRole.id,
        },
      });

      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: {
            action: permissionAction,
            role: publicRole.id,
          },
        });
      }
    }
  }
}

function paragraphBlock(text) {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text }],
  };
}

async function seedDefaultContent(strapi) {
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
    }
  }
}

module.exports = {
  register() {},

  async bootstrap({ strapi }) {
    // #region agent log
    fetch('http://host.docker.internal:7840/ingest/133e5be4-3aa4-440f-8689-c818d8f44f13',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'870467'},body:JSON.stringify({sessionId:'870467',location:'cms/src/index.js:bootstrap',message:'Strapi bootstrap started',data:{},hypothesisId:'H1',timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
    // #endregion
    await enablePublicPermissions(strapi);
    await seedDefaultContent(strapi);
    // #region agent log
    fetch('http://host.docker.internal:7840/ingest/133e5be4-3aa4-440f-8689-c818d8f44f13',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'870467'},body:JSON.stringify({sessionId:'870467',location:'cms/src/index.js:bootstrap',message:'Strapi bootstrap completed',data:{seeded:true},hypothesisId:'H1',timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
    // #endregion
  },
};
