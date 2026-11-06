/**
 * Words for engine reason codes and "show the math" step labels, from the web app's English
 * locale JSON (loaded as data). A raw code is never shown: unknown codes are humanized.
 */
import type { CalculationStep, ReasonCode } from '@openbridge/shared';
import { type Translate, formatCents } from './format.js';

/** Reason params that hold integer cents and render as currency (as in the web app). */
const MONEY_PARAMS = new Set(['income', 'limit', 'amount']);

function humanize(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function renderReason(t: Translate, locale: string, reason: ReasonCode): string {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(reason.params)) {
    params[key] =
      typeof value === 'number' && MONEY_PARAMS.has(key) ? formatCents(locale, value) : value;
  }
  return t(`reasons:${reason.code}`, { ...params, defaultValue: humanize(reason.code) });
}

export function renderMathLabel(t: Translate, code: string): string {
  return t(`math:${code}`, { defaultValue: humanize(code.replace(/^CALC_/, '')) });
}

/** A step value: cents as dollars, pct as a whole percent, count as a number. */
export function formatStepValue(
  locale: string,
  step: Pick<CalculationStep, 'value' | 'unit'>,
): string {
  if (step.unit === 'cents') return formatCents(locale, step.value);
  if (step.unit === 'pct') {
    return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
      step.value / 100,
    );
  }
  return new Intl.NumberFormat(locale).format(step.value);
}
