import { describe, it, expect } from 'vitest';
import type { HouseholdMember } from '@openbridge/shared';
import { deriveSnapHousehold, deriveMagiHousehold } from './household.js';

const asOf = '2026-07-02';

function member(partial: Partial<HouseholdMember> & { id: string }): HouseholdMember {
  return { relationship: 'other_relative', ...partial };
}

const family: HouseholdMember[] = [
  member({ id: 'self', relationship: 'self', age: 34 }),
  member({ id: 'spouse', relationship: 'spouse', age: 33 }),
  member({ id: 'kid1', relationship: 'child', age: 8 }),
  member({ id: 'kid2', relationship: 'child', age: 4 }),
];

describe('deriveSnapHousehold', () => {
  it('includes everyone in the common case', () => {
    const hh = deriveSnapHousehold(family, asOf);
    expect(hh.size).toBe(4);
    expect(hh.memberIds).toContain('self');
  });

  it('does not count an unborn child', () => {
    const pregnant = [...family, member({ id: 'self2', relationship: 'self', isPregnant: true })];
    const hh = deriveSnapHousehold(pregnant, asOf);
    expect(hh.size).toBe(5); // 5 people, no pregnancy bump for SNAP
  });
});

describe('deriveMagiHousehold (non-filer approximation)', () => {
  it('builds a single-family household of 4 for each member', () => {
    const forSelf = deriveMagiHousehold('self', family, asOf);
    expect(forSelf.size).toBe(4);
    expect(forSelf.assumed).toBe(true); // no tax signals -> approximation

    const forKid = deriveMagiHousehold('kid1', family, asOf);
    expect(forKid.size).toBe(4);
  });

  it('adds a pregnancy bump to household size', () => {
    const pregnantFamily = family.map((m) => (m.id === 'spouse' ? { ...m, isPregnant: true } : m));
    const forSelf = deriveMagiHousehold('self', pregnantFamily, asOf);
    expect(forSelf.size).toBe(5); // 4 people + 1 expected child
  });

  it('honors explicit filer signals without assuming', () => {
    const withSignals: HouseholdMember[] = [
      member({ id: 'p', relationship: 'self', age: 40, filesTaxes: true }),
      member({ id: 'c', relationship: 'child', age: 10, claimedAsDependentBy: 'p' }),
    ];
    const forFiler = deriveMagiHousehold('p', withSignals, asOf);
    expect(forFiler.size).toBe(2);
    expect(forFiler.assumed).toBe(false);
  });

  it("includes the applicant's spouse in the applicant-filer household", () => {
    const withSignals: HouseholdMember[] = [
      member({ id: 'self', relationship: 'self', age: 40, filesTaxes: true }),
      member({ id: 'spouse', relationship: 'spouse', age: 39 }),
      member({ id: 'c', relationship: 'child', age: 10, claimedAsDependentBy: 'self' }),
    ];
    const hh = deriveMagiHousehold('self', withSignals, asOf);
    expect(hh.memberIds.sort()).toEqual(['c', 'self', 'spouse']);
    expect(hh.assumed).toBe(false);
  });

  it("does not put the applicant's spouse into another filer's household", () => {
    // Relationships are applicant-relative: 'spouse' is the APPLICANT's spouse, not
    // grandma's. Grandma files her own taxes and her household must not absorb them.
    const roster: HouseholdMember[] = [
      member({ id: 'self', relationship: 'self', age: 40 }),
      member({ id: 'spouse', relationship: 'spouse', age: 39 }),
      member({ id: 'gma', relationship: 'grandparent', age: 70, filesTaxes: true }),
    ];
    const hh = deriveMagiHousehold('gma', roster, asOf);
    expect(hh.memberIds).toEqual(['gma']);
    // Her own spouse can't be identified from an applicant-relative roster -> assumed.
    expect(hh.assumed).toBe(true);
  });
});
