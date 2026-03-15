import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enContent from '@/locales/en/content.json';
import enSettings from '@/locales/en/settings.json';
import deCommon from '@/locales/de/common.json';
import deAuth from '@/locales/de/auth.json';
import deContent from '@/locales/de/content.json';
import deSettings from '@/locales/de/settings.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: ['common', 'auth', 'content', 'settings'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'cms_lang',
    },
    resources: {
      en: { common: enCommon, auth: enAuth, content: enContent, settings: enSettings },
      de: { common: deCommon, auth: deAuth, content: deContent, settings: deSettings },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
