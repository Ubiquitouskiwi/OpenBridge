/**
 * Income normalization (requirements §7, Q18). Converts each income source to a
 * monthly cent amount using the standard federal conversion factors.
 */
import type { IncomeSource } from '@openbridge/shared';
import { roundCents } from '@openbridge/shared';

const WEEKS_PER_MONTH = 4.33333;

/** Normalize a single income source to monthly cents. */
export function normalizeMonthlyCents(source: IncomeSource): number {
  switch (source.frequency) {
    case 'monthly':
      return roundCents(source.amountCents);
    case 'annual':
      return roundCents(source.amountCents / 12);
    case 'semimonthly':
      return roundCents(source.amountCents * 2);
    case 'biweekly':
      return roundCents(source.amountCents * 2.16667);
    case 'weekly':
      return roundCents(source.amountCents * WEEKS_PER_MONTH);
    case 'hourly': {
      const hours = source.hoursPerWeek ?? 0;
      return roundCents(source.amountCents * hours * WEEKS_PER_MONTH);
    }
    default: {
      // Exhaustiveness guard.
      const _never: never = source.frequency;
      return _never;
    }
  }
}

/** Sum all sources to a derived gross monthly income (cents). */
export function deriveGrossMonthlyIncomeCents(sources: IncomeSource[]): number {
  return sources.reduce((total, s) => total + normalizeMonthlyCents(s), 0);
}

/** Sum only earned income to monthly cents (for the SNAP earned-income deduction). */
export function earnedMonthlyIncomeCents(sources: IncomeSource[]): number {
  return sources.filter((s) => s.earned).reduce((total, s) => total + normalizeMonthlyCents(s), 0);
}
