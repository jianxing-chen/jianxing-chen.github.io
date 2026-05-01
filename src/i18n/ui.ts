import en from './en.json';
import zh from './zh.json';

export type TranslationKey = keyof typeof en;

export const languages: Record<string, string> = {
  en: 'English',
  zh: '中文',
};

export const defaultLang = 'en';

const translations: Record<string, Record<string, string>> = { en, zh };

/**
 * Extract locale from URL pathname.
 * Handles base path prefix (e.g. /en/about → "en")
 */
export function getLangFromUrl(url: URL): string {
  const pathname = url.pathname;
  // Remove base path prefix if present
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const stripped = base ? pathname.replace(base, '') : pathname;
  // Default locale (en) has no prefix; zh is under /zh/
  if (stripped === '/zh' || stripped.startsWith('/zh/')) {
    return 'zh';
  }
  return 'en';
}

/**
 * Returns a translation function for the given language.
 */
export function useTranslations(lang: string) {
  return function t(key: TranslationKey): string {
    const dict = translations[lang] || translations[defaultLang];
    const value = dict[key] || translations[defaultLang][key];
    if (!value && import.meta.env.DEV) {
      console.warn(`[i18n] Missing translation key "${key}" for lang "${lang}"`);
    }
    return value || key;
  };
}

/**
 * Generate a localized path with the correct locale prefix.
 * e.g. getLocalizedPath('/about', 'zh') → '/zh/about'
 */
export function getLocalizedPath(path: string, lang: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'zh') {
    return `${base}/zh${cleanPath === '/' ? '/' : cleanPath}`;
  }
  // Default locale (en) — no prefix
  return `${base}${cleanPath === '/' ? '/' : cleanPath}`;
}
