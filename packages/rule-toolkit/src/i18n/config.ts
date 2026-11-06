import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enToolkit from './locales/en/toolkit.json';
// The web app's English strings for outcomes, programs, reasons, and math steps, read as data
// (never web-app code), the same way the MCP server does.
import enApp from '../../../web-app/src/i18n/locales/en/common.json';
import enReasons from '../../../web-app/src/i18n/locales/en/reasons.json';
import enFactors from '../../../web-app/src/i18n/locales/en/factors.json';
import enMath from '../../../web-app/src/i18n/locales/en/math.json';

export const resources = {
  en: { toolkit: enToolkit, app: enApp, reasons: enReasons, factors: enFactors, math: enMath },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: ['toolkit', 'app', 'reasons', 'factors', 'math'],
  defaultNS: 'toolkit',
  interpolation: { escapeValue: false },
  returnNull: false,
  // Resources are bundled, so set up synchronously: the first render already has its words.
  initImmediate: false,
});

export default i18n;
