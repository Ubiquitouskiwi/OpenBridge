/**
 * The shared, cautious outcome ladder (requirements §7, Q6/Q19).
 *
 * Every program evaluator routes its final decision through decideOutcome so behavior
 * is consistent: we never output `ineligible` on status alone, and anything uncertain
 * lands on the more encouraging side.
 */
import type { EligibilityOutcome } from '@openbridge/shared';

/** Default margin (percent) around a threshold that yields possibly_eligible (Q6). */
export const NEAR_THRESHOLD_MARGIN_PCT = 10;

export interface OutcomeContext {
  /** A hard disqualifier applies (e.g. income far over limit) AND no pathway remains. */
  hardDisqualifier?: boolean;
  /** All hard tests pass with the data we have. */
  passesAllHardTests?: boolean;
  /** Passing relies on self-reported, unverifiable inputs (income, status). */
  reliesOnUnverifiable?: boolean;
  /** Result sits within the near-threshold margin. */
  withinMarginOfThreshold?: boolean;
  /** A required input for this program is missing (§7.1). */
  missingRequiredInput?: boolean;
  /** A factor cannot be computed (WIC clinic risk, vehicle assets). */
  uncomputableFactor?: boolean;
}

/**
 * Decide an outcome from the context. Order matters: soft-uncertainty conditions win
 * over a hard "no" so we never discourage a plausibly-eligible person.
 */
export function decideOutcome(ctx: OutcomeContext): EligibilityOutcome {
  if (ctx.missingRequiredInput || ctx.uncomputableFactor || ctx.withinMarginOfThreshold) {
    return 'possibly_eligible';
  }
  if (ctx.hardDisqualifier) {
    return 'ineligible';
  }
  if (ctx.passesAllHardTests) {
    return ctx.reliesOnUnverifiable ? 'likely_eligible' : 'eligible';
  }
  return 'unknown';
}

/**
 * Ranking used to roll member outcomes up to the most encouraging one (Q37), and by the
 * scenario module to tell when a result gets less likely.
 */
export const OUTCOME_RANK: Readonly<Record<EligibilityOutcome, number>> = {
  eligible: 5,
  likely_eligible: 4,
  possibly_eligible: 3,
  unknown: 2,
  ineligible: 1,
};

/** The most encouraging outcome among the given ones (for per-member rollups). */
export function mostEncouraging(outcomes: EligibilityOutcome[]): EligibilityOutcome {
  if (outcomes.length === 0) return 'unknown';
  return outcomes.reduce((best, o) => (OUTCOME_RANK[o] > OUTCOME_RANK[best] ? o : best));
}

/** Whether `valueCents` is within NEAR_THRESHOLD_MARGIN_PCT of `limitCents`. */
export function isNearThreshold(valueCents: number, limitCents: number): boolean {
  if (limitCents <= 0) return false;
  const diffPct = (Math.abs(valueCents - limitCents) / limitCents) * 100;
  return diffPct <= NEAR_THRESHOLD_MARGIN_PCT;
}
