/**
 * Localizes engine reason codes, factor labels, step codes, and document codes
 * (requirement 5.9, Q25). Fallback chain is handled by i18next (active locale → English
 * via fallbackLng) plus a final humanized rendering of the key so a raw code is never shown.
 */
import type { i18n as I18n } from 'i18next';
import type { ReasonCode } from '@openbridge/shared';

/** Param names that hold integer cents and should render as localized currency. */
const MONEY_PARAMS = new Set(['income', 'limit', 'amount']);

function humanize(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function formatParams(
  params: Record<string, string | number>,
  locale: string,
): Record<string, string | number> {
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' });
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k] = typeof v === 'number' && MONEY_PARAMS.has(k) ? currency.format(v / 100) : v;
  }
  return out;
}

export function renderReason(i18n: I18n, reason: ReasonCode): string {
  return i18n.t(`reasons:${reason.code}`, {
    ...formatParams(reason.params, i18n.language),
    defaultValue: humanize(reason.code),
  });
}

export function renderFactorLabel(i18n: I18n, labelCode: string): string {
  return i18n.t(`factors:${labelCode}`, { defaultValue: humanize(labelCode) });
}

export function renderStep(i18n: I18n, code: string): string {
  return i18n.t(`steps:${code}`, { defaultValue: humanize(code) });
}

/** Localized label for a "show the math" calculation step code (`math` namespace). */
export function renderMathLabel(i18n: I18n, code: string): string {
  return i18n.t(`math:${code}`, { defaultValue: humanize(code.replace(/^CALC_/, '')) });
}
