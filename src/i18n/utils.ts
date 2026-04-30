import type { Locale } from './config';
import { DEFAULT_LOCALE } from './config';

import en from './en.json';
import zhCN from './zh-CN.json';
import zhTW from './zh-TW.json';
import ja from './ja.json';
import ko from './ko.json';
import de from './de.json';
import fr from './fr.json';
import es from './es.json';

const STRINGS: Record<Locale, typeof en> = {
  en,
  'zh-CN': zhCN as typeof en,
  'zh-TW': zhTW as typeof en,
  ja: ja as typeof en,
  ko: ko as typeof en,
  de: de as typeof en,
  fr: fr as typeof en,
  es: es as typeof en,
};

/** Look up the translated bundle for a locale. Falls back to English on miss. */
export function t(locale: Locale | undefined): typeof en {
  if (!locale) return STRINGS[DEFAULT_LOCALE];
  return STRINGS[locale] ?? STRINGS[DEFAULT_LOCALE];
}
