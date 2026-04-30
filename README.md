# unflick-website

Marketing site for [unflick](https://github.com/zhitongblog/unflick).

- **Stack**: Astro 5 (static) + Tailwind + Cloudflare Pages
- **i18n**: 8 locales — `en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `de`, `fr`, `es`
- **Country detection**: Cloudflare Pages Function reads `cf-ipcountry` and 302-redirects `/` to the right locale. Switching language sets a `lang` cookie that overrides detection on later visits.

## Local dev

```bash
npm install
npm run dev    # http://localhost:4321/en/  (root redirect only runs on Pages)
npm run build  # produces ./dist
```

## Project layout

```
.
├── astro.config.mjs       # i18n + static output config
├── functions/
│   └── index.ts           # CF Pages Function: country → locale redirect at /
├── public/                # Static assets (favicon, OG image)
├── src/
│   ├── components/        # TopAdBanner, Header, Hero, Features, McpDemo, Download, Footer
│   ├── i18n/
│   │   ├── config.ts      # locale list + country→locale map
│   │   ├── utils.ts       # t(locale) → string bundle
│   │   └── <lang>.json    # one file per locale
│   ├── layouts/BaseLayout.astro
│   ├── pages/[locale]/index.astro   # one landing page per locale
│   └── styles/global.css
└── tailwind.config.mjs
```

## Deploying to Cloudflare Pages

1. Push to GitHub (`zhitongblog/unflick-website`).
2. In the Cloudflare dashboard: **Pages → Create project → Connect to Git** and pick this repo.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - (Functions directory is auto-detected from `functions/`)
4. Set the custom domain to `unflick.app` once the domain is purchased.

## Adding a language

1. Add the locale code to `LOCALES` and `LOCALE_NAMES` in `src/i18n/config.ts`.
2. Map relevant ISO country codes in `COUNTRY_TO_LOCALE` (in both `src/i18n/config.ts` *and* `functions/index.ts`).
3. Copy `src/i18n/en.json` to `src/i18n/<new>.json` and translate.
4. Wire the new file in `src/i18n/utils.ts`.
5. The dynamic route `src/pages/[locale]/index.astro` picks it up automatically.

## Editing copy

All user-visible strings live in `src/i18n/<locale>.json`. Translations were drafted with AI as a starting point — native-speaker PRs welcome.

The download URLs point to GitHub releases, so updating the unflick release version means updating the version string in `src/components/Download.astro`.
