import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '../engine.js';
import { federal, expansionAdapter, member, makeProfile } from '../testsupport.js';

const asOf = '2024-06-01';

function liheap(profile: Parameters<typeof makeProfile>[0]) {
  const result = evaluateEligibility(makeProfile(profile), expansionAdapter, federal, asOf, [
    'liheap',
  ]);
  return result.results.find((r) => r.programId === 'liheap')!;
}

describe('evaluateLiheap', () => {
  it('is likely_eligible under the state income limit', () => {
    // 175% of FPL(1) $15,060 = $26,355/yr; $12,000/yr is well under.
    const r = liheap({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('likely_eligible');
  });

  it('is ineligible far over the limit and says why', () => {
    const r = liheap({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 400000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('ineligible');
    expect(r.reasons.some((x) => x.code === 'GROSS_INCOME_OVER_LIMIT')).toBe(true);
  });

  it('is categorically eligible via SNAP receipt even over the income limit', () => {
    const r = liheap({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 400000, frequency: 'monthly', earned: true }],
      receivesSnap: true,
    });
    expect(r.outcome).toBe('likely_eligible');
    expect(r.reasons.some((x) => x.code === 'ADJUNCTIVELY_ELIGIBLE_VIA_RECEIPT')).toBe(true);
  });
});
