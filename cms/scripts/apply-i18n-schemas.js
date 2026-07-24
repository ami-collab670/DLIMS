/**
 * One-time helper: applies Strapi i18n pluginOptions to content-type and component schemas.
 * Run: node scripts/apply-i18n-schemas.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');

const NON_LOCALIZED_FIELDS = new Set([
  'slug',
  'slideKey',
  'iconKey',
  'sortOrder',
  'imageUrl',
  'gradientFallbackClass',
  'primaryCtaHref',
  'secondaryCtaHref',
  'featuredBannerCtaHref',
  'partnerKey',
  'logoUrl',
  'href',
  'path',
  'platformId',
  'publishedDate',
  'date',
  'time',
  'eventStatus',
]);

const LOCALIZED_CONTENT_TYPES = new Set([
  'api/home-page/content-types/home-page/schema.json',
  'api/about-page/content-types/about-page/schema.json',
  'api/site-setting/content-types/site-setting/schema.json',
  'api/service/content-types/service/schema.json',
  'api/news-article/content-types/news-article/schema.json',
  'api/event/content-types/event/schema.json',
  'api/contact-page/content-types/contact-page/schema.json',
  'api/partner/content-types/partner/schema.json',
  'api/auth-page/content-types/auth-page/schema.json',
]);

function withI18nField(attr, localized) {
  const next = { ...attr };
  next.pluginOptions = {
    ...(attr.pluginOptions || {}),
    i18n: { localized },
  };
  return next;
}

function patchContentTypeSchema(relPath) {
  const filePath = path.join(ROOT, relPath);
  const schema = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  schema.pluginOptions = {
    ...(schema.pluginOptions || {}),
    i18n: { localized: true },
  };

  for (const [name, attr] of Object.entries(schema.attributes || {})) {
    if (NON_LOCALIZED_FIELDS.has(name)) {
      schema.attributes[name] = withI18nField(attr, false);
    } else if (attr.type === 'component' || attr.type === 'dynamiczone') {
      schema.attributes[name] = withI18nField(attr, true);
    } else {
      schema.attributes[name] = withI18nField(attr, true);
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(schema, null, 2)}\n`);
}

function patchComponentSchema(relPath) {
  const filePath = path.join(ROOT, relPath);
  const schema = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const [name, attr] of Object.entries(schema.attributes || {})) {
    if (NON_LOCALIZED_FIELDS.has(name)) {
      schema.attributes[name] = withI18nField(attr, false);
    } else {
      schema.attributes[name] = withI18nField(attr, true);
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(schema, null, 2)}\n`);
}

for (const rel of LOCALIZED_CONTENT_TYPES) {
  patchContentTypeSchema(rel);
}

const componentsDir = path.join(ROOT, 'components');
function walkComponents(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkComponents(full);
    } else if (entry.name.endsWith('.json')) {
      patchComponentSchema(path.relative(ROOT, full));
    }
  }
}
walkComponents(componentsDir);

console.log('Applied i18n pluginOptions to content types and components.');