import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '../engine.js';
import { federal, expansionAdapter, member, makeProfile } from '../testsupport.js';

const asOf = '2024-06-01';

function wic(profile: Parameters<typeof makeProfile>[0]) {
  const result = evaluateEligibility(makeProfile(profile), expansionAdapter, federal, asOf, [
    'wic',
  ]);
  return result.results.find((r) => r.programId === 'wic')!;
}

describe('evaluateWic (per-member, capped at possibly_eligible)', () => {
  it('caps an income-eligible pregnant member at possibly_eligible with the clinic note', () => {
    const r = wic({
      members: [member({ id: 'm', relationship: 'self', age: 28, isPregnant: true })],
      incomeSources: [{ type: 'wages', amountCents: 200000, frequency: 'monthly', earned: true }],
    });
    const m = r.memberResults!.find((x) => x.memberId === 'm')!;
    expect(m.outcome).toBe('possibly_eligible');
    expect(m.reasons.some((x) => x.code === 'WIC_RISK_ASSESSED_AT_CLINIC')).toBe(true);
  });

  it('includes children under 5 and applies adjunctive eligibility via receipt', () => {
    const r = wic({
      members: [
        member({ id: 'p', relationship: 'self', age: 30 }),
        member({ id: 'kid', relationship: 'child', age: 3 }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 900000, frequency: 'monthly', earned: true }],
      receivesSnap: true,
    });
    const kid = r.memberResults!.find((x) => x.memberId === 'kid')!;
    expect(kid.outcome).toBe('possibly_eligible');
    expect(kid.reasons.some((x) => x.code === 'ADJUNCTIVELY_ELIGIBLE_VIA_RECEIPT')).toBe(true);
  });

  it('returns ineligible with WIC_NO_CATEGORY when no one qualifies by category', () => {
    const r = wic({
      members: [member({ id: 'a', relationship: 'self', age: 40 })],
      incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('ineligible');
    expect(r.reasons.some((x) => x.code === 'WIC_NO_CATEGORY')).toBe(true);
  });

  it('matches the postpartum category', () => {
    const r = wic({
      members: [member({ id: 'm', relationship: 'self', age: 25, isPostpartum: true })],
      incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
    });
    const m = r.memberResults!.find((x) => x.memberId === 'm')!;
    expect(m.outcome).toBe('possibly_eligible');
    expect(m.reasons.some((x) => x.code === 'WIC_CATEGORY_MATCHED')).toBe(true);
  });

  it('matches the breastfeeding category', () => {
    const r = wic({
      members: [member({ id: 'm', relationship: 'self', age: 25, isBreastfeeding: true })],
      incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
    });
    const m = r.memberResults!.find((x) => x.memberId === 'm')!;
    expect(m.outcome).toBe('possibly_eligible');
  });

  it('counts unborn children toward the WIC income-test household size', () => {
    // $32,000/yr fails 185% of FPL(1) = $27,861 but passes 185% of FPL(2) = $37,814,
    // so a pass here proves the pregnancy bump is applied.
    const r = wic({
      members: [member({ id: 'm', relationship: 'self', age: 28, isPregnant: true })],
      incomeSources: [{ type: 'wages', amountCents: 266000, frequency: 'monthly', earned: true }],
    });
    const m = r.memberResults!.find((x) => x.memberId === 'm')!;
    expect(m.outcome).toBe('possibly_eligible');
    expect(m.factors[0]!.passes).toBe(true);
  });
});
