/**
 * Eligibility orchestrator (requirements 5.1.1, 5.10.3, §7, Q38/Q40, design §3.1).
 *
 * Normalizes the profile, resolves the program set against what the adapter supports,
 * runs each program evaluator INDEPENDENTLY, applies required-input downgrades (§7.1),
 * and assembles the EligibilityResult.
 */
import type {
  EligibilityResult,
  FederalData,
  HouseholdProfile,
  ProgramEligibilityResult,
  ProgramId,
  StateAdapter,
} from '@openbridge/shared';
import { ReasonCodes } from '@openbridge/shared';
import { deriveGrossMonthlyIncomeCents } from './income.js';
import { regionForState } from './fpl.js';
import { type EvalContext } from './programs/util.js';
import { evaluateSnap } from './programs/snap.js';
import { evaluateMedicaid } from './programs/medicaid.js';
import { evaluateWic } from './programs/wic.js';
import { evaluateLiheap } from './programs/liheap.js';
import { evaluateTanf } from './programs/tanf.js';

const DEFAULT_PROGRAMS: ProgramId[] = ['snap', 'medicaid', 'wic', 'liheap', 'tanf'];

type Evaluator = (ctx: EvalContext) => ProgramEligibilityResult;

const EVALUATORS: Partial<Record<ProgramId, Evaluator>> = {
  snap: evaluateSnap,
  medicaid: evaluateMedicaid,
  wic: evaluateWic,
  liheap: evaluateLiheap,
  tanf: evaluateTanf,
};

/** Derive computed fields (gross income, region, residency default). */
export function normalizeProfile(profile: HouseholdProfile): HouseholdProfile {
  return {
    ...profile,
    grossMonthlyIncomeCents: deriveGrossMonthlyIncomeCents(profile.incomeSources),
    fplRegion: regionForState(profile.stateCode),
    isStateResident: profile.isStateResident ?? true,
  };
}

export function evaluateEligibility(
  rawProfile: HouseholdProfile,
  adapter: StateAdapter,
  federal: FederalData,
  evaluationDate: string,
  programs: ProgramId[] = DEFAULT_PROGRAMS,
): EligibilityResult {
  const profile = normalizeProfile(rawProfile);
  const fplTable = federal.fplTables[profile.fplRegion];
  const ctx: EvalContext = { profile, adapter, federal, evaluationDate, fplTable };

  // Required inputs common to all programs (§7.1): a household roster and a state.
  const missingCommonInput = profile.members.length === 0 || !profile.stateCode;
  // An hourly income source without hours can't be normalized — it would silently count
  // as $0 and overstate eligibility, so results are downgraded instead (§7.1).
  const missingHourlyHours = profile.incomeSources.some(
    (s) => s.frequency === 'hourly' && s.hoursPerWeek === undefined,
  );

  const results = programs.map((programId) => {
    const evaluator = EVALUATORS[programId];
    const configured = adapter.programs[programId as keyof StateAdapter['programs']] !== undefined;
    if (!evaluator || !configured) {
      return makeUnknownResult(programId, profile);
    }
    const result = evaluator(ctx);
    if (missingCommonInput) return downgradeForMissingInput(result);
    if (missingHourlyHours) return downgradeForMissingInput(result, 'hoursPerWeek');
    return result;
  });

  // Freshness notice (Q29): FPL tables, SNAP tables, and the adapter itself all age.
  const stale =
    isStale(fplTable.expectedRefreshDate, evaluationDate) ||
    isStale(federal.snap.expectedRefreshDate, evaluationDate) ||
    isAdapterStale(adapter.lastVerified, evaluationDate);
  if (stale) {
    for (const r of results) {
      r.reasons = [{ code: ReasonCodes.DATA_MAY_BE_OUT_OF_DATE, params: {} }, ...r.reasons];
    }
  }

  return {
    profile,
    results,
    evaluationDate,
    rulesLastUpdated: fplTable.effectiveDate,
    dataVersion: `${fplTable.year}`,
  };
}

function makeUnknownResult(
  programId: ProgramId,
  profile: HouseholdProfile,
): ProgramEligibilityResult {
  return {
    programId,
    scope: 'household',
    outcome: 'unknown',
    reasons: [{ code: ReasonCodes.PROGRAM_NOT_YET_SUPPORTED, params: { program: programId } }],
    factors: [],
    fplCalculation: {
      householdSize: profile.members.length,
      region: profile.fplRegion,
      fplAnnualCents: 0,
      percentageOfFpl: 0,
    },
    nextStepCodes: ['STEP_SEE_OFFICIAL_PROGRAM_PAGE'],
    applyUrl: '',
    requiredDocumentCodes: [],
  };
}

function downgradeForMissingInput(
  result: ProgramEligibilityResult,
  requirement?: string,
): ProgramEligibilityResult {
  if (result.outcome === 'unknown') return result;
  return {
    ...result,
    outcome: 'possibly_eligible',
    reasons: [
      { code: ReasonCodes.MISSING_REQUIRED_INPUT, params: requirement ? { requirement } : {} },
      ...result.reasons,
    ],
  };
}

function parseUtc(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime();
}

function isStale(expectedRefreshDate: string, asOf: string): boolean {
  return parseUtc(asOf) > parseUtc(expectedRefreshDate);
}

/** An adapter unreviewed for over a year is treated as stale (Q29). */
const ADAPTER_STALE_AFTER_DAYS = 365;

function isAdapterStale(lastVerified: string, asOf: string): boolean {
  const ageMs = parseUtc(asOf) - parseUtc(lastVerified);
  return ageMs > ADAPTER_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}
