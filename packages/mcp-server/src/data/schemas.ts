/**
 * Zod schemas for the reference data and English locale files this server loads at startup.
 * Mirrors `scripts/lib/loaders.ts` (the CI validator) so a file that passes CI also loads
 * here. Validate at the boundary, then trust the types (engineering standards).
 */
import * as z from 'zod/v4';

const provenance = z.object({
  field: z.string(),
  sourceName: z.string(),
  url: z.url(),
  publishedDate: z.string(),
  note: z.string().optional(),
});

export const provenanceList = z.array(provenance);

export const fplTableSchema = z.object({
  region: z.enum(['contiguous', 'alaska', 'hawaii']),
  year: z.number(),
  baseAnnualCents: z.number().int().nonnegative(),
  perAdditionalPersonCents: z.number().int().nonnegative(),
  effectiveDate: z.string(),
  expectedRefreshDate: z.string(),
});

export const snapFederalSchema = z.object({
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

const programIds = z.enum(['snap', 'medicaid', 'chip', 'wic', 'liheap', 'tanf', 'ui', 'ssi_ssdi']);

export const stateAdapterSchema = z.object({
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
  portalUrls: z.partialRecord(programIds, z.string()),
  sources: provenanceList,
  verificationStatus: z.enum(['verified', 'draft']),
  lastVerified: z.string(),
  lastVerifiedBy: z.string(),
});

/** A locale namespace file: string leaves, nested objects allowed (e.g. `common.outcome`). */
export interface LocaleTree {
  [key: string]: string | LocaleTree;
}

export const localeTreeSchema: z.ZodType<LocaleTree> = z.lazy(() =>
  z.record(z.string(), z.union([z.string(), localeTreeSchema])),
);
