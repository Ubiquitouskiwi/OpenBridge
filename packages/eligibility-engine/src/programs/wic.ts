/**
 * WIC evaluator (requirements §7 WIC, 5.1.9, Q19/Q37). Per-member.
 *
 * WIC serves pregnant individuals and children under 5. It has no immigration-status test,
 * and every result caps at `possibly_eligible` because nutritional risk is assessed at a
 * WIC clinic (Q19). Adjunctive income eligibility applies via actual receipt of
 * SNAP/Medicaid/TANF.
 */
import type {
  HouseholdMember,
  MemberEligibility,
  ProgramEligibilityResult,
  ReasonCode,
} from '@openbridge/shared';
import { ReasonCodes } from '@openbridge/shared';
import { isNearAgeBoundary, resolveAgeYears } from '@openbridge/shared';
import { isNearThreshold, mostEncouraging } from '../outcome.js';
import { pregnancyBump } from '../household.js';
import {
  type EvalContext,
  annualFplTestSteps,
  applyUrl,
  factor,
  fplAnnualForSize,
} from './util.js';

const WIC_CHILD_AGE_MAX = 4; // under 5

function isWicCategory(member: HouseholdMember, asOf: string): boolean {
  if (member.isPregnant || member.isPostpartum || member.isBreastfeeding) return true;
  const age = resolveAgeYears(member, asOf);
  return age !== undefined && age <= WIC_CHILD_AGE_MAX;
}

/** Q24: an age-only entry just past the "under 5" cutoff might actually be under 5. */
function isNearWicAgeBoundary(member: HouseholdMember): boolean {
  return isNearAgeBoundary(member, WIC_CHILD_AGE_MAX + 1);
}

export function evaluateWic(ctx: EvalContext): ProgramEligibilityResult {
  const cfg = ctx.adapter.programs.wic!;
  const { profile, evaluationDate } = ctx;
  // WIC counts unborn children toward household size for the income test.
  const allIds = profile.members.map((m) => m.id);
  const wicSize = profile.members.length + pregnancyBump(profile.members, allIds);
  const fplAnnual = fplAnnualForSize(ctx, wicSize);
  const annualIncome = profile.grossMonthlyIncomeCents * 12;
  const incomeLimit = Math.round((fplAnnual * cfg.incomeLimitPct) / 100);

  const adjunctive =
    profile.receivesSnap === true ||
    profile.receivesMedicaid === true ||
    profile.receivesCashAssistance === true;

  const categoryMembers = profile.members.filter((m) => isWicCategory(m, evaluationDate));
  // Q24: age-only entries just past the child cutoff are treated as possibly in category.
  const nearCategoryMembers = profile.members.filter(
    (m) => !isWicCategory(m, evaluationDate) && isNearWicAgeBoundary(m),
  );

  if (categoryMembers.length === 0 && nearCategoryMembers.length === 0) {
    return baseResult(ctx, 'ineligible', [], [{ code: ReasonCodes.WIC_NO_CATEGORY, params: {} }]);
  }

  const incomePass = adjunctive || annualIncome <= incomeLimit;
  const near = isNearThreshold(annualIncome, incomeLimit);

  const memberResults: MemberEligibility[] = [...categoryMembers, ...nearCategoryMembers].map(
    (m) => {
      const nearCategory = !isWicCategory(m, evaluationDate);
      const reasons: ReasonCode[] = [
        nearCategory
          ? { code: ReasonCodes.AGE_NEAR_CATEGORY_BOUNDARY, params: {} }
          : { code: ReasonCodes.WIC_CATEGORY_MATCHED, params: {} },
      ];
      if (adjunctive) {
        reasons.push({ code: ReasonCodes.ADJUNCTIVELY_ELIGIBLE_VIA_RECEIPT, params: {} });
      }
      if (!incomePass) {
        reasons.push({
          code: ReasonCodes.GROSS_INCOME_OVER_LIMIT,
          params: { income: annualIncome, limit: incomeLimit },
        });
      }
      // Every WIC result is capped at possibly_eligible pending clinic risk assessment.
      reasons.push({ code: ReasonCodes.WIC_RISK_ASSESSED_AT_CLINIC, params: {} });
      const outcome = !incomePass && !near ? 'ineligible' : 'possibly_eligible';
      return {
        memberId: m.id,
        outcome,
        reasons,
        factors: [factor('WIC_ANNUAL_INCOME', annualIncome, incomeLimit, incomePass)],
        calculation: annualFplTestSteps(
          wicSize,
          fplAnnual,
          cfg.incomeLimitPct,
          'wic.incomeLimitPct',
          annualIncome,
          incomeLimit,
        ),
      };
    },
  );

  const outcome = mostEncouraging(memberResults.map((r) => r.outcome));
  return baseResult(ctx, outcome, memberResults, [], wicSize);
}

function baseResult(
  ctx: EvalContext,
  outcome: ProgramEligibilityResult['outcome'],
  memberResults: MemberEligibility[],
  reasons: ReasonCode[],
  size?: number,
): ProgramEligibilityResult {
  const rosterSize = size ?? ctx.profile.members.length;
  const fplAnnual = fplAnnualForSize(ctx, rosterSize);
  const annualIncome = ctx.profile.grossMonthlyIncomeCents * 12;
  return {
    programId: 'wic',
    scope: 'per_member',
    outcome,
    reasons,
    factors: [],
    memberResults: memberResults.length > 0 ? memberResults : undefined,
    fplCalculation: {
      householdSize: rosterSize,
      region: ctx.profile.fplRegion,
      fplAnnualCents: fplAnnual,
      percentageOfFpl: fplAnnual > 0 ? (annualIncome / fplAnnual) * 100 : 0,
    },
    nextStepCodes: ['STEP_CONTACT_WIC_CLINIC'],
    applyUrl: applyUrl(ctx, 'wic'),
    requiredDocumentCodes: ['DOC_IDENTITY', 'DOC_INCOME_PROOF', 'DOC_RESIDENCY'],
  };
}
