/**
 * Data loaders + Zod schemas for federal reference data and state adapters
 * (requirements 5.10/5.14, design §4). Used by validate-state-adapter.ts and the
 * fixtures runner. Reads the versioned JSON under data/.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { FederalData, HouseholdProfile, StateAdapter } from '@openbridge/shared';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = resolve(HERE, '../../data');

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/* ---- schemas ---- */

const provenance = z.object({
  field: z.string(),
  sourceName: z.string(),
  url: z.string().url(),
  publishedDate: z.string(),
  note: z.string().optional(),
});

const fplTable = z.object({
  region: z.enum(['contiguous', 'alaska', 'hawaii']),
  year: z.number(),
  baseAnnualCents: z.number().int().nonnegative(),
  perAdditionalPersonCents: z.number().int().nonnegative(),
  effectiveDate: z.string(),
  expectedRefreshDate: z.string(),
});

const snapFederal = z.object({
  maxAllotmentByHouseholdSizeCents: z.array(z.number().int().nonnegative()),
  standardDeductionByHouseholdSizeCents: z.array(z.number().int().nonnegative()),
  earnedIncomeDeductionRate: z.number(),
  benefitReductionRate: z.number(),
  shelterCapCents: z.number().int().nonnegative(),
  medicalDeductionThresholdCents: z.number().int().nonnegative(),
  minBenefit1to2Cents: z.number().int().nonnegative(),
  abawdMinAge: z.number().int().nonnegative(),
  abawdMaxAge: z.number().int().nonnegative(),
  elderlyAge: z.number().int().nonnegative(),
  effectiveDate: z.string(),
  expectedRefreshDate: z.string(),
});

const snapConfig = z.object({
  bbce: z.boolean(),
  grossIncomeLimitPct: z.number(),
  netIncomeLimitPct: z.number().nullable(),
  assetLimitCents: z.number().int().nullable(),
  assetLimitElderlyDisabledCents: z.number().int().nullable(),
  hasVehicleAssetTest: z.boolean(),
});

const medicaidConfig = z.object({
  expansion: z.boolean(),
  adultLimitPct: z.number(),
  parentCaretakerLimitPct: z.number(),
  pregnantLimitPct: z.number(),
  childTiers: z.array(z.object({ maxAgeInclusive: z.number(), limitPct: z.number() })).min(1),
});

const stateAdapter = z.object({
  stateCode: z.string().length(2),
  stateName: z.string(),
  medicaidExpansion: z.boolean(),
  programs: z.object({
    snap: snapConfig.optional(),
    medicaid: medicaidConfig.optional(),
    wic: z.object({ incomeLimitPct: z.number() }).optional(),
    liheap: z.object({ incomeLimitPct: z.number(), categoricalIfSnap: z.boolean() }).optional(),
    tanf: z
      .object({
        baseMonthlyLimitCents: z.number().int(),
        perAdditionalPersonCents: z.number().int(),
      })
      .optional(),
  }),
  portalUrls: z.record(z.string()),
  sources: z.array(provenance),
  verificationStatus: z.enum(['verified', 'draft']),
  lastVerified: z.string(),
  lastVerifiedBy: z.string(),
});

const fixture = z.object({
  name: z.string(),
  profile: z.object({}).passthrough(),
  expected: z.record(z.string()),
  expectedMembers: z.record(z.record(z.string())).optional(),
  /** Optional golden benefit estimates (integer cents) per program. */
  expectedBenefits: z.record(z.number().int()).optional(),
});

export type Fixture = z.infer<typeof fixture>;

/* ---- loaders ---- */

export function loadFederalData(): FederalData {
  const fed = resolve(DATA_DIR, 'federal');
  const tables = {
    contiguous: fplTable.parse(readJson(resolve(fed, 'poverty-guidelines.contiguous.json'))),
    alaska: fplTable.parse(readJson(resolve(fed, 'poverty-guidelines.alaska.json'))),
    hawaii: fplTable.parse(readJson(resolve(fed, 'poverty-guidelines.hawaii.json'))),
  };
  const snap = snapFederal.parse(readJson(resolve(fed, 'snap.json')));
  const sources = z.array(provenance).parse(readJson(resolve(fed, 'sources.json')));
  return { fplTables: tables, snap, sources } as FederalData;
}

export function listStateCodes(): string[] {
  const dir = resolve(DATA_DIR, 'states');
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function loadStateAdapter(code: string): StateAdapter {
  const path = resolve(DATA_DIR, 'states', code, 'adapter.json');
  return stateAdapter.parse(readJson(path)) as StateAdapter;
}

export function loadFixtures(code: string): Fixture[] {
  const dir = resolve(DATA_DIR, 'states', code, 'fixtures');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => fixture.parse(readJson(resolve(dir, f))));
}

/** Build a full HouseholdProfile from a fixture's partial profile (engine normalizes the rest). */
export function fixtureProfile(f: Fixture): HouseholdProfile {
  return {
    members: [],
    incomeSources: [],
    grossMonthlyIncomeCents: 0,
    county: '',
    stateCode: '',
    fplRegion: 'contiguous',
    ...(f.profile as Partial<HouseholdProfile>),
  } as HouseholdProfile;
}
