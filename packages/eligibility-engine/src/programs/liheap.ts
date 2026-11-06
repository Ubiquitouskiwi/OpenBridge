/**
 * LIHEAP evaluator (requirements §6/§7). Household-scoped, eligibility screen only
 * (benefit amount is set by the state agency). Categorical if on SNAP (Q40 actual receipt).
 */
import type { ProgramEligibilityResult, ReasonCode } from '@openbridge/shared';
import { ReasonCodes } from '@openbridge/shared';
import { decideOutcome, isNearThreshold } from '../outcome.js';
import {
  type EvalContext,
  annualFplTestSteps,
  applyUrl,
  factor,
  fplAnnualForSize,
} from './util.js';

export function evaluateLiheap(ctx: EvalContext): ProgramEligibilityResult {
  const cfg = ctx.adapter.programs.liheap!;
  const { profile } = ctx;
  const size = profile.members.length;
  const fplAnnual = fplAnnualForSize(ctx, size);
  const annualIncome = profile.grossMonthlyIncomeCents * 12;
  const incomeLimit = Math.round((fplAnnual * cfg.incomeLimitPct) / 100);

  const reasons: ReasonCode[] = [];
  const categorical = cfg.categoricalIfSnap && profile.receivesSnap === true;
  const pass = categorical || annualIncome <= incomeLimit;
  const near = isNearThreshold(annualIncome, incomeLimit);

  if (categorical) {
    reasons.push({ code: ReasonCodes.ADJUNCTIVELY_ELIGIBLE_VIA_RECEIPT, params: {} });
  }
  if (!pass) {
    reasons.push({
      code: ReasonCodes.GROSS_INCOME_OVER_LIMIT,
      params: { income: annualIncome, limit: incomeLimit },
    });
    if (near) reasons.push({ code: ReasonCodes.INCOME_WITHIN_MARGIN, params: {} });
  }

  const outcome = decideOutcome({
    passesAllHardTests: pass,
    reliesOnUnverifiable: true,
    withinMarginOfThreshold: near,
    hardDisqualifier: !pass,
  });

  return {
    programId: 'liheap',
    scope: 'household',
    outcome,
    reasons,
    factors: [factor('LIHEAP_ANNUAL_INCOME', annualIncome, incomeLimit, pass)],
    fplCalculation: {
      householdSize: size,
      region: profile.fplRegion,
      fplAnnualCents: fplAnnual,
      percentageOfFpl: fplAnnual > 0 ? (annualIncome / fplAnnual) * 100 : 0,
    },
    nextStepCodes: ['STEP_CONTACT_LIHEAP_OFFICE'],
    applyUrl: applyUrl(ctx, 'liheap'),
    requiredDocumentCodes: ['DOC_IDENTITY', 'DOC_INCOME_PROOF', 'DOC_UTILITY_BILL'],
    calculation: annualFplTestSteps(
      size,
      fplAnnual,
      cfg.incomeLimitPct,
      'liheap.incomeLimitPct',
      annualIncome,
      incomeLimit,
    ),
  };
}
