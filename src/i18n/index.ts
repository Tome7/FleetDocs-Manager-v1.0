import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import pt from './locales/pt.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  zh: { translation: zh },
};

// Get saved language from localStorage or default to 'pt'
const savedLanguage = localStorage.getItem('language') || 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
