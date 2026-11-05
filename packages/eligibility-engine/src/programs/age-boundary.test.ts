/**
 * Q24: age-only entries near a program's category cutoff must soften to
 * possibly_eligible instead of a hard yes/no, because the stated age could sit on
 * either side of the boundary. Exact dates of birth are never softened.
 */
import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '../engine.js';
import {
  federal,
  expansionAdapter,
  nonExpansionAdapter,
  member,
  makeProfile,
} from '../testsupport.js';

const asOf = '2024-06-01';

function program(
  programId: 'wic' | 'medicaid' | 'tanf',
  profile: Parameters<typeof makeProfile>[0],
  adapter = expansionAdapter,
) {
  const result = evaluateEligibility(makeProfile(profile), adapter, federal, asOf, [programId]);
  return result.results.find((r) => r.programId === programId)!;
}

describe('Q24 age-only boundary softening', () => {
  it('WIC: an age-only 5-year-old just past the cutoff is possibly in category', () => {
    const r = program('wic', {
      members: [
        member({ id: 'p', relationship: 'self', age: 30 }),
        member({ id: 'kid', relationship: 'child', age: 5 }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 150000, frequency: 'monthly', earned: true }],
    });
    const kid = r.memberResults!.find((x) => x.memberId === 'kid')!;
    expect(kid.outcome).toBe('possibly_eligible');
    expect(kid.reasons.some((x) => x.code === 'AGE_NEAR_CATEGORY_BOUNDARY')).toBe(true);
  });

  it('WIC: an exact date of birth past the cutoff is not softened', () => {
    const r = program('wic', {
      members: [
        member({ id: 'p', relationship: 'self', age: 30 }),
        // 5 years + 1 day old at asOf, by DOB — definitively out of category.
        member({ id: 'kid', relationship: 'child', dateOfBirth: '2019-05-31' }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 150000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('ineligible');
    expect(r.reasons.some((x) => x.code === 'WIC_NO_CATEGORY')).toBe(true);
  });

  it('Medicaid: an age-only 18-year-old is softened when child vs adult limits disagree', () => {
    // TX: child limit 133% vs parent/caretaker 15%. Income ~50% FPL passes as child only.
    const r = program(
      'medicaid',
      {
        members: [member({ id: 'teen', relationship: 'child', age: 18 })],
        incomeSources: [{ type: 'wages', amountCents: 62500, frequency: 'monthly', earned: true }],
        stateCode: 'TX',
      },
      nonExpansionAdapter,
    );
    const teen = r.memberResults!.find((x) => x.memberId === 'teen')!;
    expect(teen.outcome).toBe('possibly_eligible');
    expect(teen.reasons.some((x) => x.code === 'AGE_NEAR_CATEGORY_BOUNDARY')).toBe(true);
  });

  it('TANF: an age-only 19-year-old near the dependent-child cutoff softens the category miss', () => {
    const r = program('tanf', {
      members: [
        member({ id: 's', relationship: 'self', age: 45 }),
        member({ id: 'teen', relationship: 'child', age: 19 }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 50000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('possibly_eligible');
    expect(r.reasons.some((x) => x.code === 'AGE_NEAR_CATEGORY_BOUNDARY')).toBe(true);
  });
});
