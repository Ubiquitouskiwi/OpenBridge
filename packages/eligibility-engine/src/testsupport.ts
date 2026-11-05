/**
 * Illustrative in-code fixtures for engine tests. These are NOT the authoritative state
 * adapters (those are versioned JSON in data/ with provenance + SME sign-off, tasks §5).
 * Numbers here are representative and only for exercising engine behavior.
 */
import type {
  FederalData,
  HouseholdMember,
  HouseholdProfile,
  StateAdapter,
} from '@openbridge/shared';

export const federal: FederalData = {
  fplTables: {
    contiguous: {
      region: 'contiguous',
      year: 2024,
      baseAnnualCents: 1506000, // $15,060
      perAdditionalPersonCents: 538000, // $5,380
      effectiveDate: '2024-01-17',
      expectedRefreshDate: '2100-01-31',
    },
    alaska: {
      region: 'alaska',
      year: 2024,
      baseAnnualCents: 1883000,
      perAdditionalPersonCents: 672500,
      effectiveDate: '2024-01-17',
      expectedRefreshDate: '2100-01-31',
    },
    hawaii: {
      region: 'hawaii',
      year: 2024,
      baseAnnualCents: 1732000,
      perAdditionalPersonCents: 618500,
      effectiveDate: '2024-01-17',
      expectedRefreshDate: '2100-01-31',
    },
  },
  snap: {
    maxAllotmentByHouseholdSizeCents: [
      0, 29100, 53500, 76600, 97300, 115500, 138600, 153200, 175100,
    ],
    standardDeductionByHouseholdSizeCents: [0, 20400, 20400, 20400, 21700, 25400, 29100],
    earnedIncomeDeductionRate: 0.2,
    benefitReductionRate: 0.3,
    shelterCapCents: 67200,
    medicalDeductionThresholdCents: 3500,
    minBenefit1to2Cents: 2300,
    abawdMinAge: 18,
    abawdMaxAge: 54,
    elderlyAge: 60,
    effectiveDate: '2023-10-01',
    expectedRefreshDate: '2100-10-01',
  },
  sources: [],
};

export const expansionAdapter: StateAdapter = {
  stateCode: 'OH',
  stateName: 'Ohio',
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
      childTiers: [
        { maxAgeInclusive: 1, limitPct: 206 },
        { maxAgeInclusive: 18, limitPct: 206 },
      ],
    },
    wic: { incomeLimitPct: 185 },
    liheap: { incomeLimitPct: 175, categoricalIfSnap: true },
    tanf: { baseMonthlyLimitCents: 60000, perAdditionalPersonCents: 15000 },
  },
  portalUrls: { snap: 'https://benefits.ohio.gov', medicaid: 'https://benefits.ohio.gov' },
  sources: [],
  verificationStatus: 'draft',
  lastVerified: '2026-07-02',
  lastVerifiedBy: 'pending-sme',
};

export const nonExpansionAdapter: StateAdapter = {
  stateCode: 'TX',
  stateName: 'Texas',
  medicaidExpansion: false,
  programs: {
    snap: {
      bbce: false,
      grossIncomeLimitPct: 130,
      netIncomeLimitPct: 100,
      assetLimitCents: 275000,
      assetLimitElderlyDisabledCents: 425000,
      hasVehicleAssetTest: true,
    },
    medicaid: {
      expansion: false,
      adultLimitPct: 0,
      parentCaretakerLimitPct: 15,
      pregnantLimitPct: 198,
      childTiers: [
        { maxAgeInclusive: 1, limitPct: 198 },
        { maxAgeInclusive: 5, limitPct: 144 },
        { maxAgeInclusive: 18, limitPct: 133 },
      ],
    },
    wic: { incomeLimitPct: 185 },
    liheap: { incomeLimitPct: 150, categoricalIfSnap: true },
    tanf: { baseMonthlyLimitCents: 40000, perAdditionalPersonCents: 8000 },
  },
  portalUrls: { snap: 'https://yourtexasbenefits.com' },
  sources: [],
  verificationStatus: 'draft',
  lastVerified: '2026-07-02',
  lastVerifiedBy: 'pending-sme',
};

export function member(partial: Partial<HouseholdMember> & { id: string }): HouseholdMember {
  return { relationship: 'other_relative', ...partial };
}

export function makeProfile(overrides: Partial<HouseholdProfile> = {}): HouseholdProfile {
  return {
    members: [],
    incomeSources: [],
    grossMonthlyIncomeCents: 0,
    county: 'Franklin',
    stateCode: 'OH',
    fplRegion: 'contiguous',
    ...overrides,
  };
}
