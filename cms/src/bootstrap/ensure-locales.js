const DEFAULT_LOCALE = 'en';
const AMHARIC_LOCALE = 'am';

const LOCALE_DEFINITIONS = [
  { code: DEFAULT_LOCALE, name: 'English (en)', isDefault: true },
  { code: AMHARIC_LOCALE, name: 'Amharic (am)', isDefault: false },
];

function logPrefix() {
  return '[cms-locales]';
}

async function ensureLocales(strapi) {
  const localeService = strapi.plugin('i18n').service('locales');
  const existing = await localeService.find();
  const byCode = new Map(existing.map((locale) => [locale.code, locale]));

  let created = 0;

  for (const definition of LOCALE_DEFINITIONS) {
    if (byCode.has(definition.code)) {
      continue;
    }

    await localeService.create({
      code: definition.code,
      name: definition.name,
      isDefault: definition.isDefault,
    });
    created += 1;
  }

  strapi.log.info(
    `${logPrefix()} Locales ready: ${LOCALE_DEFINITIONS.map((l) => l.code).join(', ')} (${created} created)`
  );

  return { created, codes: LOCALE_DEFINITIONS.map((l) => l.code) };
}

module.exports = {
  DEFAULT_LOCALE,
  AMHARIC_LOCALE,
  LOCALE_DEFINITIONS,
  ensureLocales,
};
