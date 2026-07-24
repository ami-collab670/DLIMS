const { ensureLocales } = require('./bootstrap/ensure-locales');
const {
  enablePublicPermissions,
  seedContent,
  verifyPublicContent,
} = require('./bootstrap/seed-content');

module.exports = {
  register() {},

  async bootstrap({ strapi }) {
    strapi.log.info('[cms-bootstrap] Starting CMS bootstrap');

    await ensureLocales(strapi);
    await enablePublicPermissions(strapi);
    await seedContent(strapi);
    await verifyPublicContent(strapi);

    strapi.log.info('[cms-bootstrap] CMS bootstrap completed');
  },
};
