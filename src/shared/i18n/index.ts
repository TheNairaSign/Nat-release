import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en';

// i18next's default export is the singleton instance.
// eslint-disable-next-line import/no-named-as-default-member
void i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});

export { i18next as i18n };
