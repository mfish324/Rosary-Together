import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import locale files
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import tl from './locales/tl.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  tl: { translation: tl },
};

// Get device locale and map to supported language
function getDeviceLanguage(): string {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';

  // Map common locale codes to our supported languages
  const localeMap: Record<string, string> = {
    en: 'en',
    es: 'es',
    pt: 'pt',
    tl: 'tl',
    fil: 'tl', // Filipino maps to Tagalog
  };

  return localeMap[deviceLocale] || 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

export async function changeLanguage(language: string): Promise<void> {
  await i18n.changeLanguage(language);
}

export function getCurrentLanguage(): string {
  return i18n.language;
}
