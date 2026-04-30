import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://unflick.app',
  integrations: [tailwind()],
  // Static output. Country-based redirect is handled by a Cloudflare Pages
  // Function at /functions/index.ts so the static build stays cacheable.
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es'],
    routing: {
      // Every locale lives under /<locale>/, including English. The root
      // (/) is left empty so the Pages Function can handle the redirect.
      prefixDefaultLocale: true,
      // Don't auto-generate /index.html → /en redirect; we want the CF
      // Pages Function at functions/index.ts to handle / instead so the
      // redirect is country-aware rather than always going to English.
      redirectToDefaultLocale: false,
    },
  },
  build: {
    // Each page becomes <name>.html (no per-route directories) so CF Pages
    // serves /en/index.html as /en/.
    format: 'directory',
  },
});
