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

function snapResult(profile: Parameters<typeof makeProfile>[0], adapter = expansionAdapter) {
  const result = evaluateEligibility(makeProfile(profile), adapter, federal, asOf, ['snap']);
  return result.results.find((r) => r.programId === 'snap')!;
}

describe('evaluateSnap', () => {
  it('is likely_eligible for a low-income family under the gross limit', () => {
    const r = snapResult({
      members: [
        member({ id: 's', relationship: 'self', age: 30 }),
        member({ id: 'k', relationship: 'child', age: 5 }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 150000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('likely_eligible');
    expect(r.estimatedBenefitCents).toBeGreaterThan(0);
  });

  it('is ineligible when gross income is far over the limit (BBCE state)', () => {
    const r = snapResult({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 500000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('ineligible');
  });

  it('is categorically eligible when receiving cash assistance', () => {
    const r = snapResult({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 500000, frequency: 'monthly', earned: true }],
      receivesCashAssistance: true,
    });
    expect(r.outcome).toBe('likely_eligible');
  });

  it('applies the minimum benefit for a small household', () => {
    const r = snapResult({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 120000, frequency: 'monthly', earned: true }],
    });
    expect(r.estimatedBenefitCents).toBeGreaterThanOrEqual(federal.snap.minBenefit1to2Cents);
  });

  it('explains an over-limit result with GROSS_INCOME_OVER_LIMIT', () => {
    const r = snapResult({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 500000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).toBe('ineligible');
    expect(r.reasons.some((x) => x.code === 'GROSS_INCOME_OVER_LIMIT')).toBe(true);
  });

  it('bumps a 1-person household with a zero formula benefit to the federal minimum', () => {
    // Net income high enough that maxAllotment - 30% * net <= 0, but gross still passes.
    const r = snapResult({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 150000, frequency: 'monthly', earned: true }],
    });
    expect(r.outcome).not.toBe('ineligible');
    expect(r.estimatedBenefitCents).toBe(federal.snap.minBenefit1to2Cents);
    expect(r.reasons.some((x) => x.code === 'SNAP_MINIMUM_BENEFIT_APPLIED')).toBe(true);
  });

  it('does not apply the minimum benefit to a 3-person household', () => {
    const r = snapResult({
      members: [
        member({ id: 's', relationship: 'self', age: 30 }),
        member({ id: 'sp', relationship: 'spouse', age: 30 }),
        member({ id: 'k', relationship: 'child', age: 8 }),
      ],
      incomeSources: [{ type: 'other', amountCents: 279000, frequency: 'monthly', earned: false }],
    });
    expect(r.estimatedBenefitCents).toBe(0);
    expect(r.reasons.some((x) => x.code === 'SNAP_MINIMUM_BENEFIT_APPLIED')).toBe(false);
  });

  it('flags ABAWD at age 54 but not at 55 (FRA 2023 range)', () => {
    const abawdProfile = (age: number) => ({
      members: [
        member({
          id: 's',
          relationship: 'self' as const,
          age,
          employmentStatus: 'unemployed' as const,
        }),
      ],
      incomeSources: [
        {
          type: 'other' as const,
          amountCents: 100000,
          frequency: 'monthly' as const,
          earned: false,
        },
      ],
    });
    const at54 = snapResult(abawdProfile(54));
    const at55 = snapResult(abawdProfile(55));
    expect(at54.reasons.some((x) => x.code === 'SNAP_ABAWD_TIME_LIMIT_MAY_APPLY')).toBe(true);
    expect(at55.reasons.some((x) => x.code === 'SNAP_ABAWD_TIME_LIMIT_MAY_APPLY')).toBe(false);
  });

  it('notes that immigration status alone is not a disqualifier (Q17)', () => {
    const r = snapResult({
      members: [
        member({ id: 's', relationship: 'self', age: 30, eligibilityStatus: 'lpr_under_5yr' }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
    });
    expect(r.reasons.some((x) => x.code === 'STATUS_NOT_A_DISQUALIFIER')).toBe(true);
  });

  it('flags vehicle assets near the limit in a non-BBCE state', () => {
    const r = snapResult(
      {
        members: [member({ id: 's', relationship: 'self', age: 30 })],
        incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
        liquidAssetsCents: 270000, // just under $2,750
        stateCode: 'TX',
      },
      nonExpansionAdapter,
    );
    expect(r.reasons.some((x) => x.code === 'VEHICLE_ASSET_MAY_APPLY')).toBe(true);
  });
});
