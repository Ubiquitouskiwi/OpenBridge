/**
 * Pure helpers for the "show the math" view: value formatting and source lookup.
 * Kept free of React so they can be unit tested on their own.
 */
import type {
  CalculationStep,
  FederalData,
  ProvenanceSource,
  StateAdapter,
} from '@openbridge/shared';

/** Formats a step value for display: cents as USD, pct as a whole percent, count as a number. */
export function formatStepValue(
  locale: string,
  step: Pick<CalculationStep, 'value' | 'unit'>,
): string {
  if (step.unit === 'cents') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
      step.value / 100,
    );
  }
  if (step.unit === 'pct') {
    return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
      step.value / 100,
    );
  }
  return new Intl.NumberFormat(locale).format(step.value);
}

/** Formats integer cents as whole dollars ("about $650"), for rough estimates. */
export function formatWholeDollars(locale: string, cents: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

/** Formats an ISO date (YYYY-MM-DD) without shifting it by the local time zone. */
export function formatIsoDate(locale: string, iso: string): string {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(parsed);
}

/** True when `a` and `b` are the same field path, or one is a dotted parent of the other. */
function fieldsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  return longer.startsWith(shorter) && /^[.[]/.test(longer.slice(shorter.length));
}

/**
 * Finds the citation for a step's source in the adapter or federal sources. An exact field
 * match wins over a parent/child match. Returns undefined when nothing is cited yet, which
 * the UI must show honestly rather than hide.
 */
export function findCitation(
  source: CalculationStep['source'],
  adapter: Pick<StateAdapter, 'sources'> | undefined,
  federal: Pick<FederalData, 'sources'>,
): ProvenanceSource | undefined {
  if (!source) return undefined;
  const pool = source.scope === 'state' ? (adapter?.sources ?? []) : federal.sources;
  return (
    pool.find((s) => s.field === source.field) ??
    pool.find((s) => fieldsMatch(s.field, source.field))
  );
}
