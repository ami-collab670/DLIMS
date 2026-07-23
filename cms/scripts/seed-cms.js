'use strict';

const path = require('path');

const strapi = require('@strapi/strapi');

const {
  enablePublicPermissions,
  seedContent,
  verifyPublicContent,
} = require('../src/bootstrap/seed-content');

async function main() {
  const distDir = path.resolve(__dirname, '../dist');
  const app = await strapi.createStrapi({ distDir }).load();

  try {
    console.log('[cms-seed] Starting CMS content upsert...');

    await enablePublicPermissions(app);
    const summary = await seedContent(app);
    await verifyPublicContent(app);

    console.log('[cms-seed] Completed successfully');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error('[cms-seed] Failed:', error);
  process.exit(1);
});
