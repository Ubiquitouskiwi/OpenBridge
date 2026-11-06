/**
 * Reads a test case (golden fixture) file at the boundary with Zod. The shape matches
 * `scripts/lib/loaders.ts`: { name, profile, expected, expectedMembers?, expectedBenefits? }.
 * Pure: takes the file text, returns a typed fixture or an error code. Never throws.
 */
import { z } from 'zod';
import type { EligibilityOutcome, HouseholdProfile, ProgramId } from '@openbridge/shared';

const OUTCOMES = [
  'eligible',
  'likely_eligible',
  'possibly_eligible',
  'ineligible',
  'unknown',
] as const satisfies readonly EligibilityOutcome[];

const PROGRAMS = [
  'snap',
  'medicaid',
  'chip',
  'wic',
  'liheap',
  'tanf',
  'ui',
  'ssi_ssdi',
] as const satisfies readonly ProgramId[];

const outcome = z.enum(OUTCOMES);
const programId = z.enum(PROGRAMS);

const fixtureSchema = z.object({
  name: z.string().min(1),
  profile: z.looseObject({
    stateCode: z.string().min(1),
    members: z.array(z.looseObject({ id: z.string() })),
    incomeSources: z.array(z.looseObject({})).optional(),
  }),
  expected: z.partialRecord(programId, outcome),
  expectedMembers: z.partialRecord(programId, z.record(z.string(), outcome)).optional(),
  expectedBenefits: z.partialRecord(programId, z.number().int()).optional(),
});

export type FixtureFile = z.infer<typeof fixtureSchema>;

export type ParseFixtureResult =
  { ok: true; fixture: FixtureFile } | { ok: false; error: 'notJson' | 'wrongShape' };

export function parseFixture(text: string): ParseFixtureResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notJson' };
  }
  const parsed = fixtureSchema.safeParse(raw);
  return parsed.success ? { ok: true, fixture: parsed.data } : { ok: false, error: 'wrongShape' };
}

/**
 * A full profile from a fixture's partial one, filled in the same way as
 * `fixtureProfile` in `scripts/lib/loaders.ts` (the engine normalizes the rest).
 */
export function fixtureProfile(fixture: FixtureFile): HouseholdProfile {
  return {
    members: [],
    incomeSources: [],
    grossMonthlyIncomeCents: 0,
    county: '',
    fplRegion: 'contiguous',
    ...(fixture.profile as unknown as Partial<HouseholdProfile>),
    stateCode: fixture.profile.stateCode,
  } as HouseholdProfile;
}
