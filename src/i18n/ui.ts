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
  const segments = stripped.split('/').filter(Boolean);
  if (segments[0] && segments[0] in languages) {
    return segments[0];
  }
  return defaultLang;
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
  return `${base}/${lang}${cleanPath === '/' ? '/' : cleanPath}`;
}
