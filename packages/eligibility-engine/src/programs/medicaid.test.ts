import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '../engine.js';
import {
  federal,
  nonExpansionAdapter,
  expansionAdapter,
  member,
  makeProfile,
} from '../testsupport.js';

const asOf = '2024-06-01';

function medicaid(profile: Parameters<typeof makeProfile>[0], adapter = nonExpansionAdapter) {
  const result = evaluateEligibility(makeProfile(profile), adapter, federal, asOf, ['medicaid']);
  return result.results.find((r) => r.programId === 'medicaid')!;
}

describe('evaluateMedicaid (per-member)', () => {
  it('covers children but not the parent in a non-expansion state', () => {
    const r = medicaid({
      members: [
        member({ id: 'parent', relationship: 'self', age: 35 }),
        member({ id: 'kid', relationship: 'child', age: 4 }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 150000, frequency: 'monthly', earned: true }],
      stateCode: 'TX',
    });
    expect(r.scope).toBe('per_member');
    const kid = r.memberResults!.find((m) => m.memberId === 'kid')!;
    const parent = r.memberResults!.find((m) => m.memberId === 'parent')!;
    expect(['eligible', 'likely_eligible']).toContain(kid.outcome);
    expect(parent.outcome).toBe('ineligible');
    // Program rollup is the most encouraging member outcome.
    expect(['eligible', 'likely_eligible']).toContain(r.outcome);
  });

  it('never marks an elderly adult ineligible on income alone (non-MAGI pathway)', () => {
    const r = medicaid({
      members: [member({ id: 'gp', relationship: 'self', age: 70 })],
      incomeSources: [
        { type: 'social_security', amountCents: 300000, frequency: 'monthly', earned: false },
      ],
      stateCode: 'TX',
    });
    const gp = r.memberResults!.find((m) => m.memberId === 'gp')!;
    expect(gp.outcome).toBe('possibly_eligible');
    expect(gp.reasons.some((x) => x.code === 'MEDICAID_NONMAGI_PATHWAY_POSSIBLE')).toBe(true);
  });

  it('covers a low-income adult in an expansion state', () => {
    const r = medicaid(
      {
        members: [member({ id: 'a', relationship: 'self', age: 40 })],
        incomeSources: [{ type: 'wages', amountCents: 120000, frequency: 'monthly', earned: true }],
        stateCode: 'OH',
      },
      expansionAdapter,
    );
    const a = r.memberResults!.find((m) => m.memberId === 'a')!;
    expect(['eligible', 'likely_eligible']).toContain(a.outcome);
  });

  it('does not disqualify on immigration status alone', () => {
    const r = medicaid({
      members: [
        member({ id: 'a', relationship: 'self', age: 40, eligibilityStatus: 'undocumented' }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 500000, frequency: 'monthly', earned: true }],
      stateCode: 'TX',
    });
    const a = r.memberResults!.find((m) => m.memberId === 'a')!;
    expect(a.outcome).not.toBe('ineligible');
    expect(a.reasons.some((x) => x.code === 'STATUS_NEEDS_HUMAN_REVIEW')).toBe(true);
  });
});
