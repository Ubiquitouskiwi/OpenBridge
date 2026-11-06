/**
 * Builds a golden test case (fixture) from a made-up household, in the exact JSON shape
 * `scripts/lib/loaders.ts` validates: { name, profile, expected, expectedMembers?,
 * expectedBenefits? }. Pure: no I/O, no clock.
 */
import type {
  EligibilityOutcome,
  EligibilityResult,
  HouseholdProfile,
  ProgramId,
} from '@openbridge/shared';

/**
 * The fixture runner evaluates every fixture on this date (`FIXTURE_AS_OF` in
 * `scripts/lib/fixtures.ts`). Pre-filled outcomes use the same date so a reviewer who
 * changes nothing gets a fixture that passes. Keep the two in sync.
 */
export const FIXTURE_EVALUATION_DATE = '2024-06-01';

export interface FixtureFile {
  name: string;
  profile: Partial<HouseholdProfile>;
  expected: Partial<Record<ProgramId, EligibilityOutcome>>;
  expectedMembers?: Partial<Record<ProgramId, Record<string, EligibilityOutcome>>>;
  expectedBenefits?: Partial<Record<ProgramId, number>>;
}

/** The reviewer's chosen outcomes, per program and per member. */
export interface ExpectedSelections {
  programs: Partial<Record<ProgramId, EligibilityOutcome>>;
  members: Partial<Record<ProgramId, Record<string, EligibilityOutcome>>>;
}

/**
 * The profile as a fixture stores it: derived fields the engine recomputes are dropped
 * (gross income from sources, FPL region from state, and the residency default).
 */
export function fixtureProfileOf(profile: HouseholdProfile): Partial<HouseholdProfile> {
  const copy = JSON.parse(JSON.stringify(profile)) as Partial<HouseholdProfile>;
  delete copy.grossMonthlyIncomeCents;
  delete copy.fplRegion;
  if (copy.isStateResident === true) delete copy.isStateResident;
  return copy;
}

/** Pre-fills every select with what the engine says now. */
export function defaultSelections(result: EligibilityResult): ExpectedSelections {
  const selections: ExpectedSelections = { programs: {}, members: {} };
  for (const r of result.results) {
    selections.programs[r.programId] = r.outcome;
    if (r.scope === 'per_member' && r.memberResults && r.memberResults.length > 0) {
      selections.members[r.programId] = Object.fromEntries(
        r.memberResults.map((m) => [m.memberId, m.outcome]),
      );
    }
  }
  return selections;
}

/**
 * Golden benefit amounts are only kept where the reviewer agreed with the engine's
 * outcome; a changed outcome means the engine's estimate is not a trusted expectation.
 */
function agreedBenefits(
  result: EligibilityResult,
  selections: ExpectedSelections,
): Partial<Record<ProgramId, number>> {
  const out: Partial<Record<ProgramId, number>> = {};
  for (const r of result.results) {
    if (r.estimatedBenefitCents !== undefined && selections.programs[r.programId] === r.outcome) {
      out[r.programId] = r.estimatedBenefitCents;
    }
  }
  return out;
}

export function buildFixture(
  name: string,
  profile: HouseholdProfile,
  engineResult: EligibilityResult,
  selections: ExpectedSelections,
): FixtureFile {
  const fixture: FixtureFile = {
    name: name.trim(),
    profile: fixtureProfileOf(profile),
    expected: { ...selections.programs },
  };
  const members = Object.entries(selections.members).filter(
    ([, byMember]) => byMember && Object.keys(byMember).length > 0,
  );
  if (members.length > 0) fixture.expectedMembers = Object.fromEntries(members);
  const benefits = agreedBenefits(engineResult, selections);
  if (Object.keys(benefits).length > 0) fixture.expectedBenefits = benefits;
  return fixture;
}

/** Kebab-case file name from the test-case name, e.g. "Single parent, 2 kids" to "single-parent-2-kids.json". */
export function fixtureFileName(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return `${slug || 'test-case'}.json`;
}
