'use strict';

const fs = require('fs');
const path = require('path');

const strapi = require('@strapi/strapi');

const {
  enablePublicPermissions,
  seedContent,
  verifyPublicContent,
} = require('../src/bootstrap/seed-content');

async function main() {
  const appRoot = path.resolve(__dirname, '..');
  const distDir = path.join(appRoot, 'dist');
  const useDist = fs.existsSync(path.join(distDir, 'config', 'database.js'));
  const app = await strapi.createStrapi(useDist ? { distDir } : { appDir: appRoot }).load();

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
