/**
 * Income "what if" scenarios and benefit-cliff detection.
 *
 * Answers the navigator question "if I take the raise, what changes?" by re-running the
 * unchanged engine on adjusted copies of the profile. Pure and deterministic like the rest
 * of the engine: no clock, no I/O, and the caller passes every input.
 */
import type {
  EligibilityOutcome,
  FederalData,
  HouseholdProfile,
  IncomeSource,
  ProgramId,
  StateAdapter,
} from '@openbridge/shared';
import { evaluateEligibility } from './engine.js';
import { deriveGrossMonthlyIncomeCents } from './income.js';
import { OUTCOME_RANK } from './outcome.js';

/** Default scan range for cliffs: up to $3,000 more per month, in $25 steps. */
export const DEFAULT_CLIFF_SCAN_MAX_CENTS = 300_000;
export const DEFAULT_CLIFF_SCAN_STEP_CENTS = 2_500;

/**
 * A copy of the profile whose total monthly income changes by `deltaMonthlyCents`.
 * Increases are modeled as extra monthly wages for the person filling out the form (the
 * common "more hours or a raise" case). Decreases scale every source down proportionally.
 */
export function withMonthlyIncomeChange(
  profile: HouseholdProfile,
  deltaMonthlyCents: number,
): HouseholdProfile {
  const delta = Math.round(deltaMonthlyCents);
  if (delta === 0) return profile;
  if (delta > 0) {
    const self = profile.members.find((m) => m.relationship === 'self');
    const extra: IncomeSource = {
      type: 'wages',
      amountCents: delta,
      frequency: 'monthly',
      earned: true,
      ...(self ? { memberId: self.id } : {}),
    };
    return { ...profile, incomeSources: [...profile.incomeSources, extra] };
  }
  const total = deriveGrossMonthlyIncomeCents(profile.incomeSources);
  if (total <= 0) return profile;
  const factor = Math.max(0, total + delta) / total;
  return {
    ...profile,
    incomeSources: profile.incomeSources.map((s) => ({
      ...s,
      amountCents: Math.round(s.amountCents * factor),
    })),
  };
}

export interface ScenarioProgramResult {
  programId: ProgramId;
  outcome: EligibilityOutcome;
  estimatedBenefitCents?: number;
  memberOutcomes?: { memberId: string; outcome: EligibilityOutcome }[];
}

export interface IncomeScenario {
  deltaMonthlyCents: number;
  grossMonthlyIncomeCents: number;
  programs: ScenarioProgramResult[];
}

/** Evaluate the household at each income change in `deltasMonthlyCents`. */
export function evaluateIncomeScenarios(
  profile: HouseholdProfile,
  adapter: StateAdapter,
  federal: FederalData,
  evaluationDate: string,
  deltasMonthlyCents: number[],
): IncomeScenario[] {
  return deltasMonthlyCents.map((delta) => {
    const result = evaluateEligibility(
      withMonthlyIncomeChange(profile, delta),
      adapter,
      federal,
      evaluationDate,
    );
    return {
      deltaMonthlyCents: delta,
      grossMonthlyIncomeCents: result.profile.grossMonthlyIncomeCents,
      programs: result.results.map((r) => ({
        programId: r.programId,
        outcome: r.outcome,
        ...(r.estimatedBenefitCents !== undefined
          ? { estimatedBenefitCents: r.estimatedBenefitCents }
          : {}),
        ...(r.memberResults
          ? {
              memberOutcomes: r.memberResults.map((m) => ({
                memberId: m.memberId,
                outcome: m.outcome,
              })),
            }
          : {}),
      })),
    };
  });
}

/**
 * The first income increase at which a program (or one person's coverage) gets less
 * likely. `uncertainAtDeltaCents` is the first step where the outcome drops below where it
 * started (for example likely to possibly); `lostAtDeltaCents` is the first step where it
 * becomes ineligible. Either is undefined when it never happens within the scan.
 */
export interface IncomeCliff {
  programId: ProgramId;
  memberId?: string;
  baselineOutcome: EligibilityOutcome;
  uncertainAtDeltaCents?: number;
  lostAtDeltaCents?: number;
}

export interface CliffScanOptions {
  maxIncreaseCents?: number;
  stepCents?: number;
}

/** Scan income increases and report where each currently-plausible result weakens. */
export function findIncomeCliffs(
  profile: HouseholdProfile,
  adapter: StateAdapter,
  federal: FederalData,
  evaluationDate: string,
  options: CliffScanOptions = {},
): IncomeCliff[] {
  const max = Math.max(0, options.maxIncreaseCents ?? DEFAULT_CLIFF_SCAN_MAX_CENTS);
  const stepSize = Math.max(100, options.stepCents ?? DEFAULT_CLIFF_SCAN_STEP_CENTS);
  const deltas: number[] = [];
  for (let d = 0; d <= max; d += stepSize) deltas.push(d);

  const scenarios = evaluateIncomeScenarios(profile, adapter, federal, evaluationDate, deltas);
  const baseline = scenarios[0];
  if (!baseline) return [];

  const cliffs: IncomeCliff[] = [];
  for (const base of baseline.programs) {
    if (base.outcome !== 'ineligible' && base.outcome !== 'unknown') {
      cliffs.push(scanTrack(base.programId, undefined, base.outcome, scenarios, (p) => p.outcome));
    }
    for (const m of base.memberOutcomes ?? []) {
      if (m.outcome === 'ineligible' || m.outcome === 'unknown') continue;
      cliffs.push(
        scanTrack(
          base.programId,
          m.memberId,
          m.outcome,
          scenarios,
          (p) => p.memberOutcomes?.find((x) => x.memberId === m.memberId)?.outcome,
        ),
      );
    }
  }
  return cliffs;
}

function scanTrack(
  programId: ProgramId,
  memberId: string | undefined,
  baselineOutcome: EligibilityOutcome,
  scenarios: IncomeScenario[],
  pick: (p: ScenarioProgramResult) => EligibilityOutcome | undefined,
): IncomeCliff {
  const cliff: IncomeCliff = { programId, baselineOutcome, ...(memberId ? { memberId } : {}) };
  for (const s of scenarios.slice(1)) {
    const program = s.programs.find((p) => p.programId === programId);
    // A member missing from a per-member result means they are no longer in a category.
    const outcome = (program && pick(program)) ?? 'ineligible';
    if (
      cliff.uncertainAtDeltaCents === undefined &&
      OUTCOME_RANK[outcome] < OUTCOME_RANK[baselineOutcome]
    ) {
      cliff.uncertainAtDeltaCents = s.deltaMonthlyCents;
    }
    if (outcome === 'ineligible') {
      cliff.lostAtDeltaCents = s.deltaMonthlyCents;
      break;
    }
  }
  return cliff;
}
