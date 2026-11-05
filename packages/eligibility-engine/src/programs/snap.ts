/**
 * SNAP evaluator (requirements §7 SNAP, Q14/Q22/Q40). Household-scoped.
 *
 * Implements gross/net income tests with BBCE waivers, the standard deduction set,
 * a categorical-eligibility shortcut via actual receipt, a benefit estimate floored at
 * the federal minimum benefit, an ABAWD notice, and a vehicle-asset caveat.
 */
import type { FactorRow, ProgramEligibilityResult, ReasonCode } from '@openbridge/shared';
import { ReasonCodes, percentOfCents, roundCents } from '@openbridge/shared';
import { resolveAgeYears } from '@openbridge/shared';
import { decideOutcome, isNearThreshold } from '../outcome.js';
import { deriveSnapHousehold } from '../household.js';
import { earnedMonthlyIncomeCents } from '../income.js';
import {
  type EvalContext,
  applyUrl,
  factor,
  isElderlyOrDisabled,
  monthlyFplLimit,
} from './util.js';

export function evaluateSnap(ctx: EvalContext): ProgramEligibilityResult {
  const { profile, adapter, evaluationDate } = ctx;
  const cfg = adapter.programs.snap!;
  const household = deriveSnapHousehold(profile.members, evaluationDate);
  const size = household.size;
  const grossMonthly = profile.grossMonthlyIncomeCents;

  const reasons: ReasonCode[] = [];
  const factors: FactorRow[] = [];

  // Categorical eligibility via actual receipt of TANF/GA cash assistance (Q40).
  const categorical = profile.receivesCashAssistance === true;

  const grossLimit = monthlyFplLimit(ctx, size, cfg.grossIncomeLimitPct);
  const grossPass = categorical || grossMonthly <= grossLimit;
  factors.push(factor('SNAP_GROSS_INCOME', grossMonthly, grossLimit, grossPass));
  if (!grossPass) {
    reasons.push({
      code: ReasonCodes.GROSS_INCOME_OVER_LIMIT,
      params: { income: grossMonthly, limit: grossLimit },
    });
  }

  // Net income (only when not categorical / not BBCE-waived).
  const netMonthly = computeNetIncome(ctx);
  const netLimit =
    cfg.netIncomeLimitPct === null ? null : monthlyFplLimit(ctx, size, cfg.netIncomeLimitPct);
  const netWaived = categorical || cfg.bbce || netLimit === null;
  const netPass = netWaived || netMonthly <= (netLimit as number);
  if (!netWaived) {
    factors.push(factor('SNAP_NET_INCOME', netMonthly, netLimit as number, netPass));
    reasons.push({
      code: netPass ? ReasonCodes.NET_INCOME_WITHIN_LIMIT : ReasonCodes.NET_INCOME_OVER_LIMIT,
      params: { income: netMonthly, limit: netLimit as number },
    });
  }

  // Asset test (waived under BBCE / categorical).
  const anyElderlyDisabled = profile.members.some((m) =>
    isElderlyOrDisabled(m, evaluationDate, ctx.federal.snap.elderlyAge),
  );
  const assetLimit = anyElderlyDisabled ? cfg.assetLimitElderlyDisabledCents : cfg.assetLimitCents;
  const assetWaived = categorical || cfg.bbce || assetLimit === null;
  const assets = profile.liquidAssetsCents ?? 0;
  const assetPass = assetWaived || assets <= (assetLimit as number);
  if (!assetWaived) {
    factors.push(factor('SNAP_ASSETS', assets, assetLimit as number, assetPass));
    if (!assetPass) {
      reasons.push({
        code: ReasonCodes.ASSETS_OVER_LIMIT,
        params: { amount: assets, limit: assetLimit as number },
      });
    }
    if (cfg.hasVehicleAssetTest && isNearThreshold(assets, assetLimit as number)) {
      reasons.push({ code: ReasonCodes.VEHICLE_ASSET_MAY_APPLY, params: {} });
    }
  }

  const passesAll = grossPass && netPass && assetPass;
  const withinMargin =
    (!grossPass && isNearThreshold(grossMonthly, grossLimit)) ||
    (!netWaived && !netPass && isNearThreshold(netMonthly, netLimit as number));
  const hardDisqualifier = !grossPass || (!netWaived && !netPass) || (!assetWaived && !assetPass);

  if (categorical) {
    reasons.push({ code: ReasonCodes.CATEGORICALLY_ELIGIBLE_VIA_RECEIPT, params: {} });
  }
  if (withinMargin) {
    reasons.push({ code: ReasonCodes.INCOME_WITHIN_MARGIN, params: {} });
  }

  // Immigration status never disqualifies on its own (Q17): surface that as a notice
  // whenever a member's status would otherwise raise questions.
  const anyStatusInQuestion = profile.members.some(
    (m) =>
      m.eligibilityStatus !== undefined &&
      m.eligibilityStatus !== 'us_citizen' &&
      m.eligibilityStatus !== 'national',
  );
  if (anyStatusInQuestion) {
    reasons.push({ code: ReasonCodes.STATUS_NOT_A_DISQUALIFIER, params: {} });
  }

  const outcome = decideOutcome({
    passesAllHardTests: passesAll,
    reliesOnUnverifiable: true,
    hardDisqualifier,
    withinMarginOfThreshold: withinMargin,
  });

  // Benefit estimate for anyone not clearly ineligible.
  let estimatedBenefitCents: number | undefined;
  if (outcome !== 'ineligible') {
    estimatedBenefitCents = estimateBenefit(ctx, size, netMonthly, reasons);
  }
  if (grossPass) {
    reasons.push({
      code: ReasonCodes.GROSS_INCOME_WITHIN_LIMIT,
      params: { income: grossMonthly, limit: grossLimit },
    });
  }

  // ABAWD notice (never disqualifying, Q19).
  if (hasAbawdMember(ctx)) {
    reasons.push({ code: ReasonCodes.SNAP_ABAWD_TIME_LIMIT_MAY_APPLY, params: {} });
  }

  return {
    programId: 'snap',
    scope: 'household',
    outcome,
    reasons,
    factors,
    estimatedBenefitCents,
    fplCalculation: {
      householdSize: size,
      region: profile.fplRegion,
      fplAnnualCents: monthlyFplLimit(ctx, size, 100) * 12,
      percentageOfFpl: percentOfIncome(ctx, size, grossMonthly),
    },
    nextStepCodes: ['STEP_REVIEW_AND_APPLY'],
    applyUrl: applyUrl(ctx, 'snap'),
    requiredDocumentCodes: ['DOC_IDENTITY', 'DOC_INCOME_PROOF', 'DOC_RESIDENCY'],
  };
}

function computeNetIncome(ctx: EvalContext): number {
  const { profile, federal, evaluationDate } = ctx;
  const household = deriveSnapHousehold(profile.members, evaluationDate);
  const size = household.size;
  const gross = profile.grossMonthlyIncomeCents;
  const earned = earnedMonthlyIncomeCents(profile.incomeSources);

  const earnedDeduction = percentOfCents(earned, federal.snap.earnedIncomeDeductionRate * 100);
  const standardDeduction =
    federal.snap.standardDeductionByHouseholdSizeCents[size] ??
    federal.snap.standardDeductionByHouseholdSizeCents[
      federal.snap.standardDeductionByHouseholdSizeCents.length - 1
    ] ??
    0;
  const dependentCare = profile.monthlyChildcareCostCents ?? 0;
  const childSupport = profile.monthlyChildSupportPaidCents ?? 0;

  const anyElderlyDisabled = profile.members.some((m) =>
    isElderlyOrDisabled(m, evaluationDate, federal.snap.elderlyAge),
  );
  const medical = anyElderlyDisabled
    ? Math.max(
        0,
        (profile.monthlyMedicalExpensesCents ?? 0) - federal.snap.medicalDeductionThresholdCents,
      )
    : 0;

  const adjusted = Math.max(
    0,
    gross - earnedDeduction - standardDeduction - dependentCare - childSupport - medical,
  );

  const shelterCost =
    (profile.monthlyHousingCostCents ?? 0) + (profile.monthlyUtilityCostCents ?? 0);
  const shelterExcess = Math.max(0, shelterCost - roundCents(adjusted / 2));
  const shelterDeduction = anyElderlyDisabled
    ? shelterExcess
    : Math.min(shelterExcess, federal.snap.shelterCapCents);

  return Math.max(0, adjusted - shelterDeduction);
}

function estimateBenefit(
  ctx: EvalContext,
  size: number,
  netMonthly: number,
  reasons: ReasonCode[],
): number {
  const { snap } = ctx.federal;
  const maxAllotment =
    snap.maxAllotmentByHouseholdSizeCents[size] ??
    snap.maxAllotmentByHouseholdSizeCents[snap.maxAllotmentByHouseholdSizeCents.length - 1] ??
    0;
  const raw = maxAllotment - roundCents(netMonthly * snap.benefitReductionRate);
  let benefit = Math.max(0, raw);
  // Federal minimum benefit: eligible 1–2 person households receive at least the
  // minimum allotment, even when the formula computes less (including zero). This
  // function is only called for households not already found ineligible.
  if (size <= 2 && benefit < snap.minBenefit1to2Cents) {
    benefit = snap.minBenefit1to2Cents;
    reasons.push({ code: ReasonCodes.SNAP_MINIMUM_BENEFIT_APPLIED, params: {} });
  }
  reasons.push({ code: ReasonCodes.SNAP_ESTIMATED_BENEFIT, params: { amount: benefit } });
  return benefit;
}

function hasAbawdMember(ctx: EvalContext): boolean {
  const { profile, federal, evaluationDate } = ctx;
  const hasChildren = profile.members.some((m) => (resolveAgeYears(m, evaluationDate) ?? 99) < 18);
  if (hasChildren) return false;
  return profile.members.some((m) => {
    const age = resolveAgeYears(m, evaluationDate) ?? 0;
    const working =
      profile.incomeSources.some((s) => s.memberId === m.id && s.earned) &&
      m.employmentStatus === 'employed';
    return (
      age >= federal.snap.abawdMinAge &&
      age <= federal.snap.abawdMaxAge &&
      !m.isDisabled &&
      !working
    );
  });
}

function percentOfIncome(ctx: EvalContext, size: number, monthlyIncome: number): number {
  const monthlyFpl = monthlyFplLimit(ctx, size, 100);
  if (monthlyFpl <= 0) return 0;
  return (monthlyIncome / monthlyFpl) * 100;
}
