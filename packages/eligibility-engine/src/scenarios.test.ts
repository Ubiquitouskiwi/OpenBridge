import { describe, it, expect } from 'vitest';
import { deriveGrossMonthlyIncomeCents } from './income.js';
import { evaluateIncomeScenarios, findIncomeCliffs, withMonthlyIncomeChange } from './scenarios.js';
import {
  federal,
  expansionAdapter,
  nonExpansionAdapter,
  member,
  makeProfile,
} from './testsupport.js';

const asOf = '2024-06-01';

// 2024 contiguous FPL for 1 person in testsupport: $15,060/yr -> $1,255/mo.
// Ohio test adapter SNAP gross limit: 130% -> $1,631.50/mo; the 10% band ends at $1,794.65.
const singleAdult = makeProfile({
  members: [member({ id: 'self', relationship: 'self', age: 30 })],
  incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
});

describe('withMonthlyIncomeChange', () => {
  it('adds an increase as monthly wages for the person filling out the form', () => {
    const changed = withMonthlyIncomeChange(singleAdult, 20000);
    expect(deriveGrossMonthlyIncomeCents(changed.incomeSources)).toBe(120000);
    const added = changed.incomeSources[changed.incomeSources.length - 1];
    expect(added).toMatchObject({ earned: true, memberId: 'self' });
    expect(singleAdult.incomeSources).toHaveLength(1);
  });

  it('scales every source down for a decrease and never goes below zero', () => {
    const lower = withMonthlyIncomeChange(singleAdult, -40000);
    expect(deriveGrossMonthlyIncomeCents(lower.incomeSources)).toBe(60000);
    const floor = withMonthlyIncomeChange(singleAdult, -500000);
    expect(deriveGrossMonthlyIncomeCents(floor.incomeSources)).toBe(0);
  });

  it('returns the same profile for no change', () => {
    expect(withMonthlyIncomeChange(singleAdult, 0)).toBe(singleAdult);
  });
});

describe('evaluateIncomeScenarios', () => {
  it('reports one result per program at each income change', () => {
    const scenarios = evaluateIncomeScenarios(
      singleAdult,
      expansionAdapter,
      federal,
      asOf,
      [0, 50000],
    );
    expect(scenarios.map((s) => s.grossMonthlyIncomeCents)).toEqual([100000, 150000]);
    for (const s of scenarios) expect(s.programs.map((p) => p.programId)).toContain('snap');
  });
});

describe('findIncomeCliffs', () => {
  it('finds where SNAP first gets uncertain and where it is lost', () => {
    const cliffs = findIncomeCliffs(singleAdult, expansionAdapter, federal, asOf);
    const snap = cliffs.find((c) => c.programId === 'snap' && c.memberId === undefined);
    expect(snap?.baselineOutcome).toBe('likely_eligible');
    // Just over the $1,631.50 limit -> possibly; past the 10% band -> ineligible.
    expect(snap?.uncertainAtDeltaCents).toBe(65000);
    expect(snap?.lostAtDeltaCents).toBe(80000);
  });

  it('tracks each person separately so a parent losing coverage is not hidden by a child', () => {
    const family = makeProfile({
      stateCode: 'TX',
      members: [
        member({ id: 'self', relationship: 'self', age: 34 }),
        member({ id: 'kid1', relationship: 'child', age: 7 }),
      ],
      incomeSources: [{ type: 'wages', amountCents: 10000, frequency: 'monthly', earned: true }],
    });
    const cliffs = findIncomeCliffs(family, nonExpansionAdapter, federal, asOf);
    const parent = cliffs.find((c) => c.programId === 'medicaid' && c.memberId === 'self');
    const child = cliffs.find((c) => c.programId === 'medicaid' && c.memberId === 'kid1');
    expect(parent?.lostAtDeltaCents).toBeDefined();
    expect(child?.lostAtDeltaCents).toBeDefined();
    expect(parent!.lostAtDeltaCents!).toBeLessThan(child!.lostAtDeltaCents!);
  });

  it('reports no cliff for a program that is already ineligible', () => {
    const cliffs = findIncomeCliffs(singleAdult, expansionAdapter, federal, asOf);
    expect(cliffs.some((c) => c.programId === 'wic')).toBe(false);
  });

  it('is deterministic', () => {
    const a = findIncomeCliffs(singleAdult, expansionAdapter, federal, asOf);
    const b = findIncomeCliffs(singleAdult, expansionAdapter, federal, asOf);
    expect(a).toEqual(b);
  });
});
