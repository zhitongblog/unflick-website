/**
 * Cloudflare Pages Function — handles GET /
 *
 * Static files for /<locale>/ are served first by CF Pages. The site root
 * has no static index.html on purpose, so this function runs and decides
 * which locale to redirect to:
 *
 *   1. lang cookie (set by every locale page on render) — respects
 *      whatever the user last looked at, including manual switches.
 *   2. cf-ipcountry header — Cloudflare's IP-based country, set on every
 *      request automatically.
 *   3. Fallback to the default locale (English).
 */

// Mirrors src/i18n/config.ts. Kept inline because Pages Functions can't
// share imports with the Astro src tree at runtime.
const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es'] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'en';

const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  CN: 'zh-CN', SG: 'zh-CN',
  HK: 'zh-TW', TW: 'zh-TW', MO: 'zh-TW',
  JP: 'ja',
  KR: 'ko',
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es',
};

function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

function readLangCookie(cookieHeader: string | null): Locale | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|;\s*)lang=([^;]+)/);
  if (!match) return undefined;
  const decoded = decodeURIComponent(match[1]);
  return isLocale(decoded) ? decoded : undefined;
}

export const onRequestGet: PagesFunction = ({ request }) => {
  const url = new URL(request.url);

  // Only intercept the bare root. Anything else (assets, /<locale>/, etc.)
  // is handled by static files via CF Pages.
  if (url.pathname !== '/') {
    return new Response(null, { status: 404 });
  }

  const cookieLang = readLangCookie(request.headers.get('cookie'));
  const country = (request.headers.get('cf-ipcountry') ?? '').toUpperCase();
  const detected = COUNTRY_TO_LOCALE[country] ?? DEFAULT_LOCALE;
  const target = cookieLang ?? detected;

  const dest = new URL(`/${target}/`, url);

  return new Response(null, {
    status: 302,
    headers: {
      Location: dest.toString(),
      // Don't cache the redirect — different visitors should hit different
      // locales without sharing a CDN-cached redirect.
      'Cache-Control': 'no-store',
      Vary: 'cookie, cf-ipcountry',
    },
  });
};
