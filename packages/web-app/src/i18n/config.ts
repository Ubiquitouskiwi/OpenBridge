import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enReasons from './locales/en/reasons.json';
import enFactors from './locales/en/factors.json';
import enSteps from './locales/en/steps.json';
import esCommon from './locales/es/common.json';
import esReasons from './locales/es/reasons.json';
import esFactors from './locales/es/factors.json';
import esSteps from './locales/es/steps.json';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const resources = {
  en: { common: enCommon, reasons: enReasons, factors: enFactors, steps: enSteps },
  es: { common: esCommon, reasons: esReasons, factors: esFactors, steps: esSteps },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'reasons', 'factors', 'steps'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
