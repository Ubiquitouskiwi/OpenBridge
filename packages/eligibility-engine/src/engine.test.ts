import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from './engine.js';
import {
  federal,
  expansionAdapter,
  nonExpansionAdapter,
  member,
  makeProfile,
} from './testsupport.js';

const asOf = '2024-06-01';

describe('evaluateEligibility orchestrator', () => {
  it('returns one result per requested program', () => {
    const result = evaluateEligibility(
      makeProfile({
        members: [member({ id: 's', relationship: 'self', age: 30 })],
        incomeSources: [{ type: 'wages', amountCents: 120000, frequency: 'monthly', earned: true }],
      }),
      expansionAdapter,
      federal,
      asOf,
    );
    expect(result.results.map((r) => r.programId).sort()).toEqual(
      ['liheap', 'medicaid', 'snap', 'tanf', 'wic'].sort(),
    );
  });

  it('normalizes derived fields (gross income + region)', () => {
    const result = evaluateEligibility(
      makeProfile({
        members: [member({ id: 's', relationship: 'self', age: 30 })],
        incomeSources: [
          { type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true },
          { type: 'other', amountCents: 60000, frequency: 'monthly', earned: false },
        ],
        stateCode: 'AK',
      }),
      expansionAdapter,
      federal,
      asOf,
    );
    expect(result.profile.grossMonthlyIncomeCents).toBe(160000);
    expect(result.profile.fplRegion).toBe('alaska');
  });

  it('marks an unsupported program (chip) as unknown, not omitted', () => {
    const result = evaluateEligibility(
      makeProfile({ members: [member({ id: 's', relationship: 'self', age: 30 })] }),
      expansionAdapter,
      federal,
      asOf,
      ['chip'],
    );
    const chip = result.results.find((r) => r.programId === 'chip')!;
    expect(chip.outcome).toBe('unknown');
    expect(chip.reasons.some((x) => x.code === 'PROGRAM_NOT_YET_SUPPORTED')).toBe(true);
  });

  it('downgrades to possibly_eligible when the household roster is empty', () => {
    const result = evaluateEligibility(
      makeProfile({
        members: [],
        incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
      }),
      expansionAdapter,
      federal,
      asOf,
      ['snap'],
    );
    const snap = result.results.find((r) => r.programId === 'snap')!;
    expect(snap.outcome).toBe('possibly_eligible');
    expect(snap.reasons.some((x) => x.code === 'MISSING_REQUIRED_INPUT')).toBe(true);
  });

  it('downgrades when an hourly income source is missing hours per week', () => {
    const result = evaluateEligibility(
      makeProfile({
        members: [member({ id: 's', relationship: 'self', age: 30 })],
        incomeSources: [{ type: 'wages', amountCents: 1500, frequency: 'hourly', earned: true }],
      }),
      expansionAdapter,
      federal,
      asOf,
      ['snap'],
    );
    const snap = result.results.find((r) => r.programId === 'snap')!;
    expect(snap.outcome).toBe('possibly_eligible');
    const reason = snap.reasons.find((x) => x.code === 'MISSING_REQUIRED_INPUT');
    expect(reason?.params.requirement).toBe('hoursPerWeek');
  });

  it('adds a freshness notice when the adapter is over a year old', () => {
    const profile = makeProfile({
      members: [member({ id: 's', relationship: 'self', age: 30 })],
      incomeSources: [{ type: 'wages', amountCents: 100000, frequency: 'monthly', earned: true }],
    });
    // Adapter lastVerified is 2026-07-02; two years later it must be flagged stale.
    const stale = evaluateEligibility(profile, expansionAdapter, federal, '2028-07-02', ['snap']);
    expect(stale.results[0]!.reasons.some((x) => x.code === 'DATA_MAY_BE_OUT_OF_DATE')).toBe(true);
    // Freshly verified (relative to the evaluation date) -> no notice.
    const fresh = evaluateEligibility(profile, expansionAdapter, federal, '2026-08-01', ['snap']);
    expect(fresh.results[0]!.reasons.some((x) => x.code === 'DATA_MAY_BE_OUT_OF_DATE')).toBe(false);
  });

  it('requires a dependent child for TANF', () => {
    const result = evaluateEligibility(
      makeProfile({
        members: [member({ id: 's', relationship: 'self', age: 40 })],
        incomeSources: [{ type: 'wages', amountCents: 10000, frequency: 'monthly', earned: true }],
        stateCode: 'TX',
      }),
      nonExpansionAdapter,
      federal,
      asOf,
      ['tanf'],
    );
    const tanf = result.results.find((r) => r.programId === 'tanf')!;
    expect(tanf.outcome).toBe('ineligible');
  });
});
