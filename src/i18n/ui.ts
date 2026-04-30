import en from './en.json';
import zh from './zh.json';

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
  return function t(key: string): string {
    const dict = translations[lang] || translations[defaultLang];
    return dict[key] || translations[defaultLang][key] || key;
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
