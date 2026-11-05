import { describe, it, expect, beforeAll } from 'vitest';
import { createInstance, type i18n as I18n } from 'i18next';
import { renderReason, renderFactorLabel } from './renderReason.js';
import enReasons from './locales/en/reasons.json';
import esReasons from './locales/es/reasons.json';

let i18n: I18n;

beforeAll(async () => {
  i18n = createInstance();
  await i18n.init({
    lng: 'es',
    fallbackLng: 'en',
    ns: ['reasons', 'factors'],
    resources: {
      en: { reasons: enReasons, factors: { SNAP_GROSS_INCOME: 'Gross monthly income' } },
      es: { reasons: esReasons, factors: {} },
    },
    interpolation: { escapeValue: false },
  });
});

describe('renderReason', () => {
  it('renders the active locale', () => {
    const text = renderReason(i18n, { code: 'WIC_NO_CATEGORY', params: {} });
    expect(text).toBe(esReasons.WIC_NO_CATEGORY);
  });

  it('formats money params as localized currency', () => {
    const text = renderReason(i18n, {
      code: 'GROSS_INCOME_OVER_LIMIT',
      params: { income: 250000, limit: 163150 },
    });
    // Currency formatting applied (cents -> dollars); exact separators vary by locale.
    expect(text).toBeTruthy();
    expect(text).not.toContain('250000');
  });

  it('humanizes an unknown code instead of leaking the raw key', () => {
    const text = renderReason(i18n, { code: 'SOME_FUTURE_CODE', params: {} });
    expect(text).toBe('Some Future Code');
  });

  it('falls back to English for a key missing in the active locale', async () => {
    const solo = createInstance();
    await solo.init({
      lng: 'es',
      fallbackLng: 'en',
      ns: ['reasons'],
      resources: {
        en: { reasons: { ONLY_IN_EN: 'English only string.' } },
        es: { reasons: {} },
      },
      interpolation: { escapeValue: false },
    });
    expect(renderReason(solo, { code: 'ONLY_IN_EN', params: {} })).toBe('English only string.');
  });
});

describe('renderFactorLabel', () => {
  it('falls back through English to a humanized label', () => {
    expect(renderFactorLabel(i18n, 'SNAP_GROSS_INCOME')).toBe('Gross monthly income');
    expect(renderFactorLabel(i18n, 'UNKNOWN_FACTOR')).toBe('Unknown Factor');
  });
});
