/**
 * Shared helpers for program evaluators: evaluation context, FPL limits, and
 * FactorRow construction. Kept engine-pure (no i18n): factor values are plain
 * two-decimal dollar strings the UI can reformat.
 */
import type {
  CalculationOp,
  CalculationStep,
  CalculationUnit,
  FactorRow,
  FederalData,
  FplTable,
  HouseholdMember,
  HouseholdProfile,
  StateAdapter,
} from '@openbridge/shared';
import { CalculationStepCodes } from '@openbridge/shared';
import { percentOfCents, roundCents } from '@openbridge/shared';
import { resolveAgeYears } from '@openbridge/shared';
import { calculateFplAnnualCents } from '../fpl.js';

export interface EvalContext {
  profile: HouseholdProfile;
  adapter: StateAdapter;
  federal: FederalData;
  evaluationDate: string;
  fplTable: FplTable;
}

/** Annual FPL (cents) for a household of the given size in this context's region. */
export function fplAnnualForSize(ctx: EvalContext, size: number): number {
  return calculateFplAnnualCents(size, ctx.fplTable);
}

/** Monthly income limit (cents) for a % of FPL at a household size. */
export function monthlyFplLimit(ctx: EvalContext, size: number, pct: number): number {
  const monthlyFpl = roundCents(fplAnnualForSize(ctx, size) / 12);
  return percentOfCents(monthlyFpl, pct);
}

/** Format integer cents as a plain 2-decimal dollar string (UI applies locale/currency). */
export function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function factor(
  labelCode: string,
  valueCents: number,
  thresholdCents: number,
  passes: boolean,
): FactorRow {
  return {
    labelCode,
    value: dollars(valueCents),
    threshold: dollars(thresholdCents),
    passes,
  };
}

export function isElderlyOrDisabled(
  member: HouseholdMember,
  asOf: string,
  elderlyAge: number,
): boolean {
  if (member.isDisabled) return true;
  const age = resolveAgeYears(member, asOf);
  return age !== undefined && age >= elderlyAge;
}

/* ---- "Show the math" calculation steps ---------------------------------------------- */

/** A state-adapter rule value, by its `sources[].field` path. */
export function stateField(field: string): CalculationStep['source'] {
  return { scope: 'state', field };
}

/** A federal reference-data value, by its `sources[].field` path. */
export function federalField(field: string): CalculationStep['source'] {
  return { scope: 'federal', field };
}

export function calcStep(
  labelCode: string,
  value: number,
  unit: CalculationUnit,
  op: CalculationOp,
  source?: CalculationStep['source'],
): CalculationStep {
  return source ? { labelCode, value, unit, op, source } : { labelCode, value, unit, op };
}

/** Income as a whole-number percent of FPL (display only; tests use the raw cents). */
export function pctOfFpl(incomeCents: number, fplCents: number): number {
  return fplCents > 0 ? Math.round((incomeCents / fplCents) * 100) : 0;
}

/**
 * Steps for the common annual-income-versus-%FPL test (Medicaid, WIC, LIHEAP). Values are
 * the exact numbers the evaluator compared, so the trace can never drift from the decision.
 */
export function annualFplTestSteps(
  size: number,
  fplAnnualCents: number,
  limitPct: number,
  limitSourceField: string,
  annualIncomeCents: number,
  annualLimitCents: number,
): CalculationStep[] {
  const C = CalculationStepCodes;
  return [
    calcStep(C.HOUSEHOLD_SIZE, size, 'count', 'input'),
    calcStep(C.ANNUAL_INCOME, annualIncomeCents, 'cents', 'input'),
    calcStep(C.FPL_ANNUAL, fplAnnualCents, 'cents', 'rule', federalField('fplTables')),
    calcStep(C.LIMIT_PCT_OF_FPL, limitPct, 'pct', 'rule', stateField(limitSourceField)),
    calcStep(C.ANNUAL_INCOME_LIMIT, annualLimitCents, 'cents', 'limit'),
    calcStep(C.INCOME_PCT_OF_FPL, pctOfFpl(annualIncomeCents, fplAnnualCents), 'pct', 'result'),
  ];
}

/** Portal URL for a program, or empty string. */
export function applyUrl(ctx: EvalContext, programId: keyof StateAdapter['portalUrls']): string {
  return ctx.adapter.portalUrls[programId] ?? '';
}
