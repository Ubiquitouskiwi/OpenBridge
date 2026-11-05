/**
 * Medicaid evaluator (requirements §7 Medicaid, 5.1.9, Q37). Per-member, MAGI only.
 *
 * Each member gets their own MAGI household and outcome; the program outcome is the most
 * encouraging member outcome. Non-MAGI pathways are out of scope but surfaced for
 * elderly/disabled members. Immigration status never disqualifies on its own (Q17).
 */
import type {
  HouseholdMember,
  MemberEligibility,
  ProgramEligibilityResult,
  ReasonCode,
} from '@openbridge/shared';
import { ReasonCodes } from '@openbridge/shared';
import { isNearAgeBoundary, resolveAgeYears } from '@openbridge/shared';
import { decideOutcome, isNearThreshold, mostEncouraging } from '../outcome.js';
import { deriveMagiHousehold } from '../household.js';
import { normalizeMonthlyCents } from '../income.js';
import { type EvalContext, applyUrl, factor, fplAnnualForSize } from './util.js';

const CHILD_AGE_MAX = 18;
const ELDERLY_AGE = 65;

function statusNeedsReview(member: HouseholdMember): boolean {
  return (
    member.eligibilityStatus === 'lpr_under_5yr' ||
    member.eligibilityStatus === 'undocumented' ||
    member.eligibilityStatus === 'other_qualified' ||
    member.eligibilityStatus === 'prefer_not_to_say'
  );
}

function householdMonthlyIncome(
  ctx: EvalContext,
  memberIds: string[],
): { incomeCents: number; missingAttribution: boolean } {
  const set = new Set(memberIds);
  const { incomeSources, members } = ctx.profile;
  const adults = members.filter((m) => (resolveAgeYears(m, ctx.evaluationDate) ?? 99) >= 18);
  let attributed = 0;
  let unattributed = 0;
  for (const s of incomeSources) {
    const monthly = normalizeMonthlyCents(s);
    if (s.memberId === undefined) unattributed += monthly;
    else if (set.has(s.memberId)) attributed += monthly;
  }
  // Unattributed income counts toward the household (conservative); flag only when it
  // could matter (more than one adult could own it).
  const missingAttribution = unattributed > 0 && adults.length > 1;
  return { incomeCents: attributed + unattributed, missingAttribution };
}

function evaluateMember(ctx: EvalContext, member: HouseholdMember): MemberEligibility {
  const cfg = ctx.adapter.programs.medicaid!;
  const reasons: ReasonCode[] = [];
  const age = resolveAgeYears(member, ctx.evaluationDate);
  const household = deriveMagiHousehold(member.id, ctx.profile.members, ctx.evaluationDate);
  const { incomeCents, missingAttribution } = householdMonthlyIncome(ctx, household.memberIds);
  const annualIncome = incomeCents * 12;
  const fplAnnual = fplAnnualForSize(ctx, household.size);
  const pctFpl = fplAnnual > 0 ? (annualIncome / fplAnnual) * 100 : 0;

  // Determine the applicable limit and a reason code.
  const hasChild = ctx.profile.members.some(
    (m) => (resolveAgeYears(m, ctx.evaluationDate) ?? 99) <= CHILD_AGE_MAX,
  );
  const adultPct = cfg.expansion ? cfg.adultLimitPct : hasChild ? cfg.parentCaretakerLimitPct : 0;
  let limitPct: number;
  let limitCode: string;
  if (member.isPregnant) {
    limitPct = cfg.pregnantLimitPct;
    limitCode = ReasonCodes.MEDICAID_PREGNANT_WITHIN_LIMIT;
  } else if (age !== undefined && age <= CHILD_AGE_MAX) {
    limitPct = childLimitPct(cfg.childTiers, age);
    limitCode = ReasonCodes.MEDICAID_CHILD_WITHIN_LIMIT;
  } else {
    limitPct = adultPct;
    limitCode = ReasonCodes.MEDICAID_ADULT_WITHIN_LIMIT;
  }

  const incomeLimitAnnual = Math.round((fplAnnual * limitPct) / 100);
  const pass = limitPct > 0 && annualIncome <= incomeLimitAnnual;
  const near = limitPct > 0 && isNearThreshold(annualIncome, incomeLimitAnnual);
  const factors = [factor('MEDICAID_ANNUAL_INCOME', annualIncome, incomeLimitAnnual, pass)];

  if (pass) reasons.push({ code: limitCode, params: { pct: Math.round(pctFpl) } });
  if (!pass) {
    reasons.push({
      code: ReasonCodes.GROSS_INCOME_OVER_LIMIT,
      params: { income: incomeCents, limit: Math.round(incomeLimitAnnual / 12) },
    });
    if (near) reasons.push({ code: ReasonCodes.INCOME_WITHIN_MARGIN, params: {} });
  }

  // Q24: an age-only entry near the child/adult category boundary is uncertain whenever
  // the two categories would decide differently. Cap the member at possibly_eligible.
  let ageBoundaryUncertain = false;
  if (!member.isPregnant && isNearAgeBoundary(member, CHILD_AGE_MAX)) {
    const childPct = childLimitPct(cfg.childTiers, CHILD_AGE_MAX);
    const passAsChild = childPct > 0 && annualIncome <= Math.round((fplAnnual * childPct) / 100);
    const passAsAdult = adultPct > 0 && annualIncome <= Math.round((fplAnnual * adultPct) / 100);
    ageBoundaryUncertain = passAsChild !== passAsAdult;
    if (ageBoundaryUncertain) {
      reasons.push({ code: ReasonCodes.AGE_NEAR_CATEGORY_BOUNDARY, params: {} });
    }
  }

  // Elderly/disabled non-MAGI pathway note (Q19) — provides a plausible pathway.
  const nonMagiPossible = (age !== undefined && age >= ELDERLY_AGE) || member.isDisabled === true;
  if (!pass && nonMagiPossible) {
    reasons.push({ code: ReasonCodes.MEDICAID_NONMAGI_PATHWAY_POSSIBLE, params: {} });
  }

  // Status handling (never disqualifies alone, Q17).
  const needsStatusReview = statusNeedsReview(member);
  if (needsStatusReview) {
    reasons.push({ code: ReasonCodes.STATUS_NEEDS_HUMAN_REVIEW, params: {} });
  }

  // Household assumption note (Q6/design §3.3).
  if (household.assumed && near) {
    reasons.push({ code: ReasonCodes.MEDICAID_HOUSEHOLD_ASSUMPTION, params: {} });
  }
  if (missingAttribution) {
    reasons.push({ code: ReasonCodes.RESULT_LIMITED_BY_MISSING_INCOME_ATTRIBUTION, params: {} });
  }

  // A plausible pathway (non-MAGI, status review, attribution/household ambiguity) prevents
  // a hard "no" per the cautious principle and routes the member to possibly_eligible.
  const plausiblePathway = nonMagiPossible || needsStatusReview || missingAttribution;
  const outcome = decideOutcome({
    passesAllHardTests: pass,
    reliesOnUnverifiable: true,
    withinMarginOfThreshold: near,
    uncomputableFactor: (!pass && plausiblePathway) || ageBoundaryUncertain,
    hardDisqualifier: !pass && !plausiblePathway && !near && !ageBoundaryUncertain,
  });

  return { memberId: member.id, outcome, reasons, factors };
}

function childLimitPct(
  tiers: { maxAgeInclusive: number; limitPct: number }[],
  age: number,
): number {
  const sorted = [...tiers].sort((a, b) => a.maxAgeInclusive - b.maxAgeInclusive);
  for (const t of sorted) {
    if (age <= t.maxAgeInclusive) return t.limitPct;
  }
  return sorted.length > 0 ? sorted[sorted.length - 1]!.limitPct : 0;
}

export function evaluateMedicaid(ctx: EvalContext): ProgramEligibilityResult {
  const memberResults = ctx.profile.members.map((m) => evaluateMember(ctx, m));
  const outcome = mostEncouraging(memberResults.map((r) => r.outcome));
  // Representative FPL calc (whole roster) for the program-level summary.
  const rosterSize = ctx.profile.members.length;
  const fplAnnual = fplAnnualForSize(ctx, rosterSize);
  const annualIncome = ctx.profile.grossMonthlyIncomeCents * 12;

  return {
    programId: 'medicaid',
    scope: 'per_member',
    outcome,
    reasons: [],
    factors: [],
    memberResults,
    fplCalculation: {
      householdSize: rosterSize,
      region: ctx.profile.fplRegion,
      fplAnnualCents: fplAnnual,
      percentageOfFpl: fplAnnual > 0 ? (annualIncome / fplAnnual) * 100 : 0,
    },
    nextStepCodes: ['STEP_REVIEW_AND_APPLY'],
    applyUrl: applyUrl(ctx, 'medicaid'),
    requiredDocumentCodes: ['DOC_IDENTITY', 'DOC_INCOME_PROOF', 'DOC_RESIDENCY'],
  };
}
