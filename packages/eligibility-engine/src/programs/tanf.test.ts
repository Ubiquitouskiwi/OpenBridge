import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '../engine.js';
import { federal, expansionAdapter, member, makeProfile } from '../testsupport.js';

const asOf = '2024-06-01';

function tanf(profile: Parameters<typeof makeProfile>[0]) {
  const result = evaluateEligibility(makeProfile(profile), expansionAdapter, federal, asOf, [
    'tanf',
  ]);
  return result.results.find((r) => r.programId === 'tanf')!;
}

describe('evaluateTanf', () => {
  it('is likely_eligible for a low-income family with a dependent child', () => {
    // Size 2 limit = 60000 + 15000 = 75000 cents/month.
    const r = tanf({
      members: [
        member({ id: 's', relationship: 'self', age: 30 }),
        member({ id: 'k', relationship: 'child', age: 5 }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 50000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('likely_eligible');
  });

  it('is ineligible over the income limit and says why', () => {
    const r = tanf({
      members: [
        member({ id: 's', relationship: 'self', age: 30 }),
        member({ id: 'k', relationship: 'child', age: 5 }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 200000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('ineligible');
    expect(r.reasons.some((x) => x.code === 'GROSS_INCOME_OVER_LIMIT')).toBe(true);
  });

  it('is ineligible with TANF_NO_DEPENDENT_CHILD when no child is listed', () => {
    const r = tanf({
      members: [member({ id: 's', relationship: 'self', age: 40 })],
      incomeSources: [{ type: 'wages', amountCents: 10000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('ineligible');
    expect(r.reasons.some((x) => x.code === 'TANF_NO_DEPENDENT_CHILD')).toBe(true);
    // The old, misleading missing-input code must not appear for a category miss.
    expect(r.reasons.some((x) => x.code === 'MISSING_REQUIRED_INPUT')).toBe(false);
  });

  it('routes a pregnant person with no other children to possibly_eligible', () => {
    const r = tanf({
      members: [member({ id: 's', relationship: 'self', age: 28, isPregnant: true })],
      incomeSources: [{ type: 'wages', amountCents: 40000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('possibly_eligible');
    expect(r.reasons.some((x) => x.code === 'TANF_PREGNANCY_MAY_QUALIFY')).toBe(true);
  });

  it('still says no to a pregnant person whose income is far over the limit', () => {
    const r = tanf({
      members: [member({ id: 's', relationship: 'self', age: 28, isPregnant: true })],
      incomeSources: [{ type: 'wages', amountCents: 400000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('ineligible');
    expect(r.reasons.some((x) => x.code === 'GROSS_INCOME_OVER_LIMIT')).toBe(true);
  });
});
