import { describe, it, expect } from 'vitest';
import type { IncomeSource } from '@openbridge/shared';
import {
  normalizeMonthlyCents,
  deriveGrossMonthlyIncomeCents,
  earnedMonthlyIncomeCents,
} from './income.js';

function src(partial: Partial<IncomeSource>): IncomeSource {
  return { type: 'wages', amountCents: 0, frequency: 'monthly', earned: true, ...partial };
}

describe('normalizeMonthlyCents', () => {
  it('handles each frequency', () => {
    expect(normalizeMonthlyCents(src({ amountCents: 100000, frequency: 'monthly' }))).toBe(100000);
    expect(normalizeMonthlyCents(src({ amountCents: 1200000, frequency: 'annual' }))).toBe(100000);
    expect(normalizeMonthlyCents(src({ amountCents: 50000, frequency: 'semimonthly' }))).toBe(
      100000,
    );
    expect(normalizeMonthlyCents(src({ amountCents: 40000, frequency: 'weekly' }))).toBe(173333);
    expect(normalizeMonthlyCents(src({ amountCents: 100000, frequency: 'biweekly' }))).toBe(216667);
  });

  it('handles hourly with hours/week', () => {
    // $20.00/hr * 40 hrs * 4.33333 weeks = $3,466.66
    expect(
      normalizeMonthlyCents(src({ amountCents: 2000, frequency: 'hourly', hoursPerWeek: 40 })),
    ).toBe(346666);
  });
});

describe('derivations', () => {
  it('sums gross across sources', () => {
    const sources = [
      src({ amountCents: 100000, frequency: 'monthly', earned: true }),
      src({ amountCents: 60000, frequency: 'monthly', earned: false, type: 'social_security' }),
    ];
    expect(deriveGrossMonthlyIncomeCents(sources)).toBe(160000);
    expect(earnedMonthlyIncomeCents(sources)).toBe(100000);
  });
});
