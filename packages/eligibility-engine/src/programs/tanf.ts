/**
 * TANF evaluator (requirements §6/§7). Household-scoped. Requires a dependent child in the
 * household and applies a state-variable monthly income limit.
 */
import type { CalculationStep, ProgramEligibilityResult, ReasonCode } from '@openbridge/shared';
import { CalculationStepCodes, ReasonCodes } from '@openbridge/shared';
import { isNearAgeBoundary, resolveAgeYears } from '@openbridge/shared';
import { decideOutcome, isNearThreshold } from '../outcome.js';
import {
  type EvalContext,
  applyUrl,
  calcStep,
  factor,
  fplAnnualForSize,
  stateField,
} from './util.js';

const DEPENDENT_CHILD_AGE_MAX = 18;

export function evaluateTanf(ctx: EvalContext): ProgramEligibilityResult {
  const cfg = ctx.adapter.programs.tanf!;
  const { profile, evaluationDate } = ctx;
  const size = profile.members.length;

  const hasDependentChild = profile.members.some(
    (m) => (resolveAgeYears(m, evaluationDate) ?? 99) <= DEPENDENT_CHILD_AGE_MAX,
  );
  // Q24: an age-only entry just past the dependent-child cutoff might actually be under it.
  const hasNearBoundaryChild = profile.members.some((m) =>
    isNearAgeBoundary(m, DEPENDENT_CHILD_AGE_MAX),
  );
  const anyPregnant = profile.members.some((m) => m.isPregnant === true);

  const monthlyLimit =
    cfg.baseMonthlyLimitCents + Math.max(0, size - 1) * cfg.perAdditionalPersonCents;
  const monthlyIncome = profile.grossMonthlyIncomeCents;
  const reasons: ReasonCode[] = [];

  if (!hasDependentChild) {
    // Many states cover a pregnant person with no other children; an age-only entry near
    // the cutoff is also uncertain. Both route to possibly_eligible instead of a hard no.
    if (anyPregnant || hasNearBoundaryChild) {
      const softReasons: ReasonCode[] = anyPregnant
        ? [{ code: ReasonCodes.TANF_PREGNANCY_MAY_QUALIFY, params: {} }]
        : [{ code: ReasonCodes.AGE_NEAR_CATEGORY_BOUNDARY, params: {} }];
      // The income test still applies: only soften the category, not a clear income "no".
      const incomePass = monthlyIncome <= monthlyLimit;
      const incomeNear = isNearThreshold(monthlyIncome, monthlyLimit);
      if (!incomePass && !incomeNear) {
        softReasons.push({
          code: ReasonCodes.GROSS_INCOME_OVER_LIMIT,
          params: { income: monthlyIncome, limit: monthlyLimit },
        });
        return build(ctx, size, 'ineligible', monthlyIncome, monthlyLimit, softReasons);
      }
      return build(ctx, size, 'possibly_eligible', monthlyIncome, monthlyLimit, softReasons);
    }
    // No dependent child -> no TANF pathway; factual category miss, not a means-test "no".
    return build(ctx, size, 'ineligible', monthlyIncome, monthlyLimit, [
      { code: ReasonCodes.TANF_NO_DEPENDENT_CHILD, params: {} },
    ]);
  }

  const pass = monthlyIncome <= monthlyLimit;
  const near = isNearThreshold(monthlyIncome, monthlyLimit);
  if (!pass) {
    reasons.push({
      code: ReasonCodes.GROSS_INCOME_OVER_LIMIT,
      params: { income: monthlyIncome, limit: monthlyLimit },
    });
    if (near) reasons.push({ code: ReasonCodes.INCOME_WITHIN_MARGIN, params: {} });
  }
  const outcome = decideOutcome({
    passesAllHardTests: pass,
    reliesOnUnverifiable: true,
    withinMarginOfThreshold: near,
    hardDisqualifier: !pass,
  });

  return build(ctx, size, outcome, monthlyIncome, monthlyLimit, reasons);
}

function build(
  ctx: EvalContext,
  size: number,
  outcome: ProgramEligibilityResult['outcome'],
  monthlyIncome: number,
  monthlyLimit: number,
  reasons: ReasonCode[],
): ProgramEligibilityResult {
  const fplAnnual = fplAnnualForSize(ctx, size);
  const annualIncome = ctx.profile.grossMonthlyIncomeCents * 12;
  return {
    programId: 'tanf',
    scope: 'household',
    outcome,
    reasons,
    factors: [
      factor('TANF_MONTHLY_INCOME', monthlyIncome, monthlyLimit, monthlyIncome <= monthlyLimit),
    ],
    fplCalculation: {
      householdSize: size,
      region: ctx.profile.fplRegion,
      fplAnnualCents: fplAnnual,
      percentageOfFpl: fplAnnual > 0 ? (annualIncome / fplAnnual) * 100 : 0,
    },
    nextStepCodes: ['STEP_REVIEW_AND_APPLY'],
    applyUrl: applyUrl(ctx, 'tanf'),
    requiredDocumentCodes: ['DOC_IDENTITY', 'DOC_INCOME_PROOF', 'DOC_RESIDENCY'],
    calculation: tanfSteps(ctx, size, monthlyIncome, monthlyLimit),
  };
}

/** TANF uses a flat state limit plus an amount per extra person, not a % of FPL. */
function tanfSteps(
  ctx: EvalContext,
  size: number,
  monthlyIncome: number,
  monthlyLimit: number,
): CalculationStep[] {
  const cfg = ctx.adapter.programs.tanf!;
  const C = CalculationStepCodes;
  const steps: CalculationStep[] = [
    calcStep(C.HOUSEHOLD_SIZE, size, 'count', 'input'),
    calcStep(C.GROSS_MONTHLY_INCOME, monthlyIncome, 'cents', 'input'),
    calcStep(
      C.TANF_BASE_LIMIT,
      cfg.baseMonthlyLimitCents,
      'cents',
      'rule',
      stateField('tanf.baseMonthlyLimitCents'),
    ),
  ];
  const extra = Math.max(0, size - 1) * cfg.perAdditionalPersonCents;
  if (extra > 0) {
    steps.push(
      calcStep(
        C.TANF_PER_PERSON_ADDITION,
        extra,
        'cents',
        'add',
        stateField('tanf.perAdditionalPersonCents'),
      ),
    );
  }
  steps.push(calcStep(C.MONTHLY_INCOME_LIMIT, monthlyLimit, 'cents', 'limit'));
  return steps;
}
