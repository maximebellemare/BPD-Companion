import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE } from './languageStorage';
import { i18nNamespaces, i18nResources, SupportedLanguage } from './resources';

void i18n
  .use(initReactI18next)
  .init({
    resources: i18nResources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'es'],
    ns: i18nNamespaces,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
    saveMissing: __DEV__,
    missingKeyHandler: (_languages, namespace, key) => {
      if (__DEV__) {
        console.warn('[i18n] Missing translation key', { namespace, key });
      }
    },
    parseMissingKeyHandler: (key, defaultValue) => defaultValue ?? (__DEV__ ? key : ''),
    compatibilityJSON: 'v4',
  });

export { i18n };
export type { SupportedLanguage };

export function isSpanish(language: SupportedLanguage): boolean {
  return language === 'es';
}

export function getAiLanguageInstruction(language: SupportedLanguage): string | null {
  if (language !== 'es') return null;
  return i18n.t('companion:aiLanguageInstruction');
}

export function formatDateForLanguage(
  timestamp: number | null | undefined,
  language: SupportedLanguage,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(language === 'es' ? 'es' : 'en', options).format(date);
}
