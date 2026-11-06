/**
 * Runs a test case through the engine and lines up what it expects with what the engine
 * says, the same checks `scripts/lib/fixtures.ts` makes in CI. Pure.
 */
import { evaluateEligibility } from '@openbridge/eligibility-engine';
import type {
  CalculationStep,
  EligibilityOutcome,
  FederalData,
  ProgramId,
  ReasonCode,
  StateAdapter,
} from '@openbridge/shared';
import { type FixtureFile, fixtureProfile } from './parseFixture.js';

/**
 * Every test case is checked as if today were this date. Keep in sync with `FIXTURE_AS_OF` in
 * `scripts/lib/fixtures.ts`, so a test case passes here exactly when it passes in CI.
 */
export const FIXTURE_EVALUATION_DATE = '2024-06-01';

interface RowBase {
  programId: ProgramId;
  pass: boolean;
  reasons: ReasonCode[];
  calculation: CalculationStep[];
}

export interface ProgramRow extends RowBase {
  kind: 'program';
  expected: EligibilityOutcome;
  actual?: EligibilityOutcome;
}

export interface MemberRow extends RowBase {
  kind: 'member';
  memberId: string;
  expected: EligibilityOutcome;
  actual?: EligibilityOutcome;
}

export interface BenefitRow extends RowBase {
  kind: 'benefit';
  expectedCents: number;
  actualCents?: number;
}

export type ComparisonRow = ProgramRow | MemberRow | BenefitRow;

export interface Comparison {
  rows: ComparisonRow[];
  passed: number;
  failed: number;
}

function entries<V>(record: Partial<Record<ProgramId, V>> | undefined): [ProgramId, V][] {
  return Object.entries(record ?? {}).filter(
    (pair): pair is [ProgramId, V] => pair[1] !== undefined,
  );
}

export function compareFixture(
  fixture: FixtureFile,
  adapter: StateAdapter,
  federal: FederalData,
): Comparison {
  const result = evaluateEligibility(
    fixtureProfile(fixture),
    adapter,
    federal,
    FIXTURE_EVALUATION_DATE,
  );
  const find = (id: ProgramId) => result.results.find((r) => r.programId === id);
  const rows: ComparisonRow[] = [];

  for (const [programId, expected] of entries(fixture.expected)) {
    const r = find(programId);
    rows.push({
      kind: 'program',
      programId,
      expected,
      actual: r?.outcome,
      pass: r?.outcome === expected,
      reasons: r?.reasons ?? [],
      calculation: r?.calculation ?? [],
    });
  }

  for (const [programId, members] of entries(fixture.expectedMembers)) {
    const r = find(programId);
    for (const [memberId, expected] of Object.entries(members)) {
      const m = r?.memberResults?.find((x) => x.memberId === memberId);
      rows.push({
        kind: 'member',
        programId,
        memberId,
        expected,
        actual: m?.outcome,
        pass: m?.outcome === expected,
        reasons: m?.reasons ?? [],
        calculation: m?.calculation ?? [],
      });
    }
  }

  for (const [programId, expectedCents] of entries(fixture.expectedBenefits)) {
    const r = find(programId);
    rows.push({
      kind: 'benefit',
      programId,
      expectedCents,
      actualCents: r?.estimatedBenefitCents,
      pass: r?.estimatedBenefitCents === expectedCents,
      reasons: [],
      calculation: r?.calculation ?? [],
    });
  }

  const passed = rows.filter((row) => row.pass).length;
  return { rows, passed, failed: rows.length - passed };
}
