import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '@openbridge/eligibility-engine';
import type { HouseholdProfile, ProgramId } from '@openbridge/shared';
import { federal, loadAdapter } from '../../data/index.js';
import {
  buildFixture,
  defaultSelections,
  fixtureFileName,
  fixtureProfileOf,
  FIXTURE_EVALUATION_DATE,
} from './buildFixture.js';

/** Synthetic household: a pregnant adult and a toddler in Ohio. */
const profile: HouseholdProfile = {
  members: [
    { id: 'member-1', relationship: 'self', age: 27, isPregnant: true },
    { id: 'member-2', relationship: 'child', age: 2 },
  ],
  incomeSources: [
    {
      type: 'wages',
      amountCents: 180_000,
      frequency: 'monthly',
      earned: true,
      memberId: 'member-1',
    },
  ],
  grossMonthlyIncomeCents: 180_000,
  monthlyHousingCostCents: 90_000,
  county: 'Franklin',
  stateCode: 'OH',
  fplRegion: 'contiguous',
  isStateResident: true,
};

/** Mirrors `fixtureProfile()` in scripts/lib/loaders.ts (defaults, then the stored fields). */
function asRunnerProfile(stored: Partial<HouseholdProfile>): HouseholdProfile {
  return {
    members: [],
    incomeSources: [],
    grossMonthlyIncomeCents: 0,
    county: '',
    stateCode: '',
    fplRegion: 'contiguous',
    ...stored,
  };
}

const adapter = loadAdapter('OH')!;
const engineResult = evaluateEligibility(profile, adapter, federal, FIXTURE_EVALUATION_DATE);

describe('buildFixture', () => {
  it('matches the fixture file shape', () => {
    const f = buildFixture(
      '  Pregnant parent  ',
      profile,
      engineResult,
      defaultSelections(engineResult),
    );
    expect(Object.keys(f).sort()).toEqual(
      ['expected', 'expectedBenefits', 'expectedMembers', 'name', 'profile'].sort(),
    );
    expect(f.name).toBe('Pregnant parent');
    for (const outcome of Object.values(f.expected)) expect(typeof outcome).toBe('string');
    expect(f.expectedMembers?.medicaid?.['member-1']).toBeDefined();
    for (const cents of Object.values(f.expectedBenefits ?? {}))
      expect(Number.isInteger(cents)).toBe(true);
  });

  it('strips derived profile fields', () => {
    const stored = fixtureProfileOf(profile);
    expect(stored).not.toHaveProperty('grossMonthlyIncomeCents');
    expect(stored).not.toHaveProperty('fplRegion');
    expect(stored).not.toHaveProperty('isStateResident');
    expect(fixtureProfileOf({ ...profile, isStateResident: false }).isStateResident).toBe(false);
    expect(stored.members).toEqual(profile.members);
  });

  it('reproduces the expected outcomes when the reviewer changes nothing', () => {
    const f = buildFixture('Round trip', profile, engineResult, defaultSelections(engineResult));
    const rerun = evaluateEligibility(
      asRunnerProfile(f.profile),
      adapter,
      federal,
      FIXTURE_EVALUATION_DATE,
    );
    for (const [id, expected] of Object.entries(f.expected)) {
      expect(rerun.results.find((r) => r.programId === (id as ProgramId))?.outcome).toBe(expected);
    }
    for (const [id, members] of Object.entries(f.expectedMembers ?? {})) {
      const r = rerun.results.find((x) => x.programId === (id as ProgramId));
      for (const [memberId, expected] of Object.entries(members ?? {})) {
        expect(r?.memberResults?.find((m) => m.memberId === memberId)?.outcome).toBe(expected);
      }
    }
    for (const [id, cents] of Object.entries(f.expectedBenefits ?? {})) {
      expect(
        rerun.results.find((r) => r.programId === (id as ProgramId))?.estimatedBenefitCents,
      ).toBe(cents);
    }
  });

  it('records a changed outcome and drops the engine benefit for that program', () => {
    const selections = defaultSelections(engineResult);
    selections.programs.snap = 'ineligible';
    const f = buildFixture('Changed', profile, engineResult, selections);
    expect(f.expected.snap).toBe('ineligible');
    expect(f.expectedBenefits?.snap).toBeUndefined();
  });
});

describe('fixtureFileName', () => {
  it('kebab-cases the name', () => {
    expect(fixtureFileName('Single parent, 2 kids!')).toBe('single-parent-2-kids.json');
    expect(fixtureFileName('Familia rápida')).toBe('familia-rapida.json');
    expect(fixtureFileName('  ***  ')).toBe('test-case.json');
  });
});
