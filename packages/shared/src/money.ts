/**
 * Integer-cent money helpers (design §3.4). Keeping money in integer cents avoids
 * floating-point drift when comparing incomes against thresholds.
 */

/** Convert a dollar amount to integer cents, rounding to the nearest cent. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents to a dollar number (may be fractional). */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Round any cent value to a whole integer cent. */
export function roundCents(cents: number): number {
  return Math.round(cents);
}

/**
 * Percentage of a cent value, rounded to whole cents.
 * e.g. percentOfCents(100_00, 130) => 130_00 (130% of $100).
 */
export function percentOfCents(cents: number, pct: number): number {
  return Math.round((cents * pct) / 100);
}

/** Express `valueCents` as a percentage of `baseCents` (0 when base is 0). */
export function asPercentOf(valueCents: number, baseCents: number): number {
  if (baseCents <= 0) return 0;
  return (valueCents / baseCents) * 100;
}

/** Annualize a monthly cent amount. */
export function monthlyToAnnualCents(monthlyCents: number): number {
  return roundCents(monthlyCents * 12);
}
