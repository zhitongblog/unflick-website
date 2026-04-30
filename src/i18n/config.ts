/**
 * i18n configuration shared between Astro pages and the Pages Function.
 * If you add a locale here, also add a JSON file under src/i18n/<locale>.json
 * AND extend the country map below.
 */

export const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Display name for each locale, in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

/**
 * ISO-3166-1 alpha-2 country code → preferred locale.
 * Anything not listed here falls through to DEFAULT_LOCALE.
 *
 * Notes:
 * - Belgium / Switzerland are multi-lingual; we pick the largest group and
 *   let users switch via the LanguageSwitcher (cookie persists their choice).
 * - Singapore defaults to zh-CN since the product is bilingual; Singaporeans
 *   reading English can switch with one click.
 */
export const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  // Chinese
  CN: 'zh-CN',
  SG: 'zh-CN',
  HK: 'zh-TW',
  TW: 'zh-TW',
  MO: 'zh-TW',

  // Japanese / Korean
  JP: 'ja',
  KR: 'ko',

  // German
  DE: 'de',
  AT: 'de',
  CH: 'de',
  LI: 'de',

  // French
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',
  MC: 'fr',

  // Spanish (covering Spain and major Latin American countries — they're
  // not "European" but it's a single-locale shipping for the same effort)
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',
  EC: 'es',
  GT: 'es',
  CU: 'es',
  BO: 'es',
  DO: 'es',
  HN: 'es',
  PY: 'es',
  SV: 'es',
  NI: 'es',
  CR: 'es',
  PA: 'es',
  UY: 'es',
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
