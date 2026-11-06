/**
 * Synthetic test inputs. Reference numbers here are illustrative only (they exercise the
 * server, not the rules); households use obviously fake labels and round amounts.
 */
import type { FederalData, StateAdapter } from '@openbridge/shared';
import { type LoadedAssets, loadLocaleBundle, resolveLocaleDir } from '../data/loader.js';
import type { HouseholdInput } from '../tools/inputSchemas.js';

export const EVAL_DATE = '2024-06-01';

export const federal: FederalData = {
  fplTables: {
    contiguous: {
      region: 'contiguous',
      year: 2024,
      baseAnnualCents: 1_506_000,
      perAdditionalPersonCents: 538_000,
      effectiveDate: '2024-01-17',
      expectedRefreshDate: '2100-01-31',
    },
    alaska: {
      region: 'alaska',
      year: 2024,
      baseAnnualCents: 1_883_000,
      perAdditionalPersonCents: 672_500,
      effectiveDate: '2024-01-17',
      expectedRefreshDate: '2100-01-31',
    },
    hawaii: {
      region: 'hawaii',
      year: 2024,
      baseAnnualCents: 1_732_000,
      perAdditionalPersonCents: 618_500,
      effectiveDate: '2024-01-17',
      expectedRefreshDate: '2100-01-31',
    },
  },
  snap: {
    maxAllotmentByHouseholdSizeCents: [0, 29_100, 53_500, 76_600, 97_300, 115_500, 138_600],
    standardDeductionByHouseholdSizeCents: [0, 20_400, 20_400, 20_400, 21_700, 25_400, 29_100],
    earnedIncomeDeductionRate: 0.2,
    benefitReductionRate: 0.3,
    shelterCapCents: 67_200,
    medicalDeductionThresholdCents: 3_500,
    minBenefit1to2Cents: 2_300,
    abawdMinAge: 18,
    abawdMaxAge: 54,
    elderlyAge: 60,
    effectiveDate: '2023-10-01',
    expectedRefreshDate: '2100-10-01',
  },
  sources: [
    {
      field: 'fplTables',
      sourceName: 'Test Poverty Guidelines',
      url: 'https://example.org/fpl',
      publishedDate: '2024-01-17',
    },
  ],
};

/** A draft test state. `snap.grossIncomeLimitPct` is cited; the TANF fields are not. */
export const testAdapter: StateAdapter = {
  stateCode: 'OH',
  stateName: 'Testland',
  medicaidExpansion: true,
  programs: {
    snap: {
      bbce: true,
      grossIncomeLimitPct: 130,
      netIncomeLimitPct: null,
      assetLimitCents: null,
      assetLimitElderlyDisabledCents: null,
      hasVehicleAssetTest: false,
    },
    medicaid: {
      expansion: true,
      adultLimitPct: 138,
      parentCaretakerLimitPct: 90,
      pregnantLimitPct: 200,
      childTiers: [{ maxAgeInclusive: 18, limitPct: 206 }],
    },
    wic: { incomeLimitPct: 185 },
    tanf: { baseMonthlyLimitCents: 60_000, perAdditionalPersonCents: 15_000 },
  },
  portalUrls: { snap: 'https://example.org/apply', medicaid: 'https://example.org/apply' },
  sources: [
    {
      field: 'snap.grossIncomeLimitPct',
      sourceName: 'Test SNAP Agency',
      url: 'https://example.org/snap',
      publishedDate: '2024-01-01',
    },
  ],
  verificationStatus: 'draft',
  lastVerified: '2024-05-01',
  lastVerifiedBy: 'test',
};

/** Synthetic assets using the real English locale (so rendered text matches the app). */
export function testAssets(): LoadedAssets {
  return {
    data: { federal, adapters: new Map([['OH', testAdapter]]) },
    locale: loadLocaleBundle(resolveLocaleDir({})),
  };
}

export function familyHousehold(overrides: Partial<HouseholdInput> = {}): HouseholdInput {
  return {
    stateCode: 'OH',
    members: [
      { id: 'self', relationship: 'self', age: 30 },
      { id: 'kid1', relationship: 'child', age: 4 },
    ],
    incomeSources: [
      { type: 'wages', amountCents: 150_000, frequency: 'monthly', earned: true, memberId: 'self' },
    ],
    ...overrides,
  };
}
