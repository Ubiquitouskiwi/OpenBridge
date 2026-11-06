/**
 * Pure formatting and parsing for rule values in natural units. No React, no clock.
 */
import { toCents } from '@openbridge/shared';
import type { RuleField, RuleValue, StateAdapter } from '@openbridge/shared';

/** Minimal translate function, so pure builders can produce localized text. */
export type Translate = (key: string, options?: Record<string, unknown>) => string;

export function formatCents(locale: string, cents: number): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function formatNumber(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

/** A rule value in words: "130% of the poverty line", "$2,750.00", "Yes", "No", or "Not used". */
export function formatRuleValue(
  t: Translate,
  locale: string,
  field: Pick<RuleField, 'unit'>,
  value: RuleValue | undefined,
): string {
  if (value === null || value === undefined) return t('value.notUsed');
  if (typeof value === 'boolean') return value ? t('value.yes') : t('value.no');
  if (field.unit === 'cents') return formatCents(locale, value);
  return t('value.pct', { value: formatNumber(locale, value) });
}

/** Formats an ISO date (YYYY-MM-DD) without shifting it by the local time zone. */
export function formatIsoDate(locale: string, iso: string): string {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(parsed);
}

/** A local calendar date as YYYY-MM-DD, for file names. */
export function isoDateOf(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Parses a dollar amount typed by a person ("$2,750", "2750.5", "1,200.00") into integer cents.
 * Returns undefined for anything that is not a plain non-negative amount with at most two
 * decimal places.
 */
export function parseDollarsToCents(input: string): number | undefined {
  const cleaned = input
    .trim()
    .replace(/^\$\s*/, '')
    .replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned) && !/^\.\d{1,2}$/.test(cleaned)) return undefined;
  // The pattern allows at most two decimals, so toCents rounds away only float noise.
  return toCents(Number(cleaned));
}

/** Parses a percent of the poverty line ("130", "130%", "137.5 %"). */
export function parsePercent(input: string): number | undefined {
  const cleaned = input.trim().replace(/\s*%$/, '').replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return undefined;
  return Number(cleaned);
}

/**
 * The plain-language label for a field (locale `fields.<labelKey>`). Child tiers name their
 * ages, worked out from the tier list: each tier starts one year after the one before it.
 */
export function fieldLabel(t: Translate, adapter: StateAdapter, field: RuleField): string {
  const tier = /^medicaid\.childTiers\.(\d+)\.limitPct$/.exec(field.path);
  if (tier) {
    const tiers = adapter.programs.medicaid?.childTiers ?? [];
    const index = Number(tier[1]);
    const maxAge = tiers[index]?.maxAgeInclusive ?? 0;
    const minAge = index === 0 ? 0 : (tiers[index - 1]?.maxAgeInclusive ?? -1) + 1;
    return t(`fields.${field.labelKey}`, { minAge, maxAge });
  }
  return t(`fields.${field.labelKey}`);
}

/** Escape text for one Markdown table cell. */
export function markdownCell(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}
