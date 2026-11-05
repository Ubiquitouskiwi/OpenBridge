/**
 * Shared helpers for program evaluators: evaluation context, FPL limits, and
 * FactorRow construction. Kept engine-pure (no i18n): factor values are plain
 * two-decimal dollar strings the UI can reformat.
 */
import type {
  FactorRow,
  FederalData,
  FplTable,
  HouseholdMember,
  HouseholdProfile,
  StateAdapter,
} from '@openbridge/shared';
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

/** Portal URL for a program, or empty string. */
export function applyUrl(ctx: EvalContext, programId: keyof StateAdapter['portalUrls']): string {
  return ctx.adapter.portalUrls[programId] ?? '';
}
