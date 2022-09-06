import i18n from 'i18next';
import Backend from 'i18next-http-backend';
// import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from 'react-i18next';

i18n
  .use(Backend)
  // .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      //Translation file path
      loadPath: '/assets/i18n/{{ns}}/{{lng}}.json',
    },
    fallbackLng: 'en',
    debug: false, // Change to true if you want to see logs on console
    ns: ['common', 'jobs'], // Name spaces -> Check public/assets/i18n  for these name spaces
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
    },
  });

export default i18n;
