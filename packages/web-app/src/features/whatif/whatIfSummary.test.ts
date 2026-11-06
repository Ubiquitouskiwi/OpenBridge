import { describe, it, expect, beforeAll } from 'vitest';
import { evaluateIncomeScenarios, findIncomeCliffs } from '@openbridge/eligibility-engine';
import type { HouseholdProfile } from '@openbridge/shared';
import i18n from '../../i18n/config.js';
import { federal, loadAdapter } from '../../data/index.js';
import { buildScenarioRows, describeCliff, signedDelta } from './whatIfSummary.js';

const AS_OF = '2024-06-01';

/** Synthetic household: one adult and one young child in Ohio. */
const profile: HouseholdProfile = {
  members: [
    { id: 'p1', relationship: 'self', age: 30 },
    { id: 'p2', relationship: 'child', age: 4 },
  ],
  incomeSources: [
    { type: 'wages', amountCents: 150_000, frequency: 'monthly', earned: true, memberId: 'p1' },
  ],
  grossMonthlyIncomeCents: 0,
  county: 'Franklin',
  stateCode: 'OH',
  fplRegion: 'contiguous',
};

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('signedDelta', () => {
  it('signs by direction and never accepts a negative amount', () => {
    expect(signedDelta('more', 25_000)).toBe(25_000);
    expect(signedDelta('less', 25_000)).toBe(-25_000);
    expect(signedDelta('more', -5)).toBe(0);
  });
});

describe('buildScenarioRows', () => {
  it('pairs every program now and with the change', () => {
    const adapter = loadAdapter('OH')!;
    const [now, changed] = evaluateIncomeScenarios(profile, adapter, federal, AS_OF, [0, 50_000]);
    const rows = buildScenarioRows(now!, changed!);
    expect(rows.map((r) => r.programId)).toEqual(now!.programs.map((p) => p.programId));
    const snap = rows.find((r) => r.programId === 'snap')!;
    expect(snap.nowBenefitCents).toBeGreaterThan(0);
    expect(snap.changedBenefitCents ?? 0).toBeLessThan(snap.nowBenefitCents!);
  });

  it('treats a program missing from the changed run as unknown, not a loss', () => {
    const rows = buildScenarioRows(
      {
        deltaMonthlyCents: 0,
        grossMonthlyIncomeCents: 0,
        programs: [{ programId: 'snap', outcome: 'eligible' }],
      },
      { deltaMonthlyCents: 100, grossMonthlyIncomeCents: 100, programs: [] },
    );
    expect(rows[0]?.changedOutcome).toBe('unknown');
  });
});

describe('describeCliff', () => {
  it('says where a program may change and stop, in whole dollars', () => {
    const text = describeCliff(
      i18n,
      {
        programId: 'snap',
        baselineOutcome: 'likely_eligible',
        uncertainAtDeltaCents: 65_000,
        lostAtDeltaCents: 80_000,
      },
      profile,
      AS_OF,
    );
    expect(text).toBe(
      'SNAP (food assistance) may change if you earn about $650 more each month. It may stop at about $800 more.',
    );
  });

  it('names the person for per-member programs', () => {
    const text = describeCliff(
      i18n,
      {
        programId: 'wic',
        memberId: 'p2',
        baselineOutcome: 'likely_eligible',
        lostAtDeltaCents: 40_000,
        uncertainAtDeltaCents: 40_000,
      },
      profile,
      AS_OF,
    );
    expect(text).toBe(
      'WIC (nutrition for parents and young children) for Person 2 (child, age 4) may stop if you earn about $400 more each month.',
    );
  });

  it('handles a result that never changes in the scan', () => {
    const text = describeCliff(
      i18n,
      { programId: 'tanf', baselineOutcome: 'possibly_eligible' },
      profile,
      AS_OF,
    );
    expect(text).toContain('did not change');
  });

  it('describes every cliff the engine finds without leaking raw codes', () => {
    const cliffs = findIncomeCliffs(profile, loadAdapter('OH')!, federal, AS_OF);
    expect(cliffs.length).toBeGreaterThan(0);
    for (const c of cliffs) {
      const text = describeCliff(i18n, c, profile, AS_OF);
      expect(text).not.toMatch(/whatif\.|programs\./);
      expect(text).not.toContain('\u2014');
    }
  });
});
