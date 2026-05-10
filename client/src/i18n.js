import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationID from './locales/id.json';
import translationEN from './locales/en.json';
import translationMS from './locales/ms.json';

const resources = {
  id: {
    translation: translationID
  },
  en: {
    translation: translationEN
  },
  ms: {
    translation: translationMS
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
