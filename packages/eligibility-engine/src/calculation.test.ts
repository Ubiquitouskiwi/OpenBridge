/**
 * "Show the math" trace tests. The trace must reproduce the exact numbers each evaluator
 * compared, so a reviewer checking the steps is checking the real decision.
 */
import { describe, it, expect } from 'vitest';
import type { CalculationStep, ProgramEligibilityResult } from '@openbridge/shared';
import { CalculationStepCodes as C } from '@openbridge/shared';
import { evaluateEligibility } from './engine.js';
import {
  federal,
  expansionAdapter,
  nonExpansionAdapter,
  member,
  makeProfile,
} from './testsupport.js';

const asOf = '2024-06-01';
const KNOWN_CODES = new Set<string>(Object.values(C));

function evaluate(overrides: Parameters<typeof makeProfile>[0], adapter = expansionAdapter) {
  return evaluateEligibility(makeProfile(overrides), adapter, federal, asOf);
}

function program(results: ProgramEligibilityResult[], id: string): ProgramEligibilityResult {
  const r = results.find((x) => x.programId === id);
  if (!r) throw new Error(`no result for ${id}`);
  return r;
}

function value(steps: CalculationStep[] | undefined, code: string): number {
  const s = steps?.find((x) => x.labelCode === code);
  if (!s) throw new Error(`no step ${code}`);
  return s.value;
}

const texasFamily = {
  stateCode: 'TX',
  members: [
    member({ id: 'self', relationship: 'self', age: 34 }),
    member({ id: 'kid1', relationship: 'child', age: 7 }),
  ],
  incomeSources: [
    { type: 'wages' as const, amountCents: 180000, frequency: 'monthly' as const, earned: true },
  ],
  monthlyHousingCostCents: 90000,
  monthlyUtilityCostCents: 20000,
  monthlyChildcareCostCents: 10000,
};

describe('calculation trace', () => {
  it('uses only known step codes and gives every rule value a source', () => {
    const { results } = evaluate(texasFamily, nonExpansionAdapter);
    const steps = results.flatMap((r) => [
      ...(r.calculation ?? []),
      ...(r.memberResults ?? []).flatMap((m) => m.calculation ?? []),
    ]);
    expect(steps.length).toBeGreaterThan(0);
    for (const s of steps) {
      expect(KNOWN_CODES.has(s.labelCode)).toBe(true);
      if (s.op === 'rule') expect(s.source).toBeDefined();
    }
  });

  it('SNAP net-income steps add up to the net income the evaluator tested', () => {
    const snap = program(evaluate(texasFamily, nonExpansionAdapter).results, 'snap');
    const steps = snap.calculation ?? [];
    const gross = value(steps, C.GROSS_MONTHLY_INCOME);
    const adjustedIdx = steps.findIndex((s) => s.labelCode === C.SNAP_ADJUSTED_INCOME);
    const deductions = steps
      .slice(0, adjustedIdx)
      .filter((s) => s.op === 'subtract')
      .reduce((sum, s) => sum + s.value, 0);
    const adjusted = value(steps, C.SNAP_ADJUSTED_INCOME);
    expect(adjusted).toBe(gross - deductions);
    expect(value(steps, C.SNAP_NET_INCOME)).toBe(adjusted - value(steps, C.SNAP_SHELTER_DEDUCTION));

    const netFactor = snap.factors.find((f) => f.labelCode === 'SNAP_NET_INCOME');
    expect(netFactor?.threshold).toBe((value(steps, C.SNAP_NET_INCOME_LIMIT) / 100).toFixed(2));
    expect(netFactor?.value).toBe((value(steps, C.SNAP_NET_INCOME) / 100).toFixed(2));
  });

  it('SNAP benefit steps match the estimated benefit', () => {
    const snap = program(evaluate(texasFamily, nonExpansionAdapter).results, 'snap');
    const steps = snap.calculation ?? [];
    expect(value(steps, C.SNAP_ESTIMATED_BENEFIT)).toBe(snap.estimatedBenefitCents);
    expect(value(steps, C.SNAP_MAX_ALLOTMENT) - value(steps, C.SNAP_BENEFIT_REDUCTION)).toBe(
      snap.estimatedBenefitCents,
    );
  });

  it('omits net-income steps when BBCE waives the net test', () => {
    const snap = program(evaluate({ ...texasFamily, stateCode: 'OH' }).results, 'snap');
    const codes = (snap.calculation ?? []).map((s) => s.labelCode);
    expect(codes).toContain(C.MONTHLY_INCOME_LIMIT);
    expect(codes).not.toContain(C.SNAP_NET_INCOME);
  });

  it('gives each Medicaid member their own trace with the limit they were tested against', () => {
    const medicaid = program(evaluate(texasFamily, nonExpansionAdapter).results, 'medicaid');
    for (const m of medicaid.memberResults ?? []) {
      const limit = value(m.calculation, C.ANNUAL_INCOME_LIMIT);
      expect(m.factors[0]?.threshold).toBe((limit / 100).toFixed(2));
    }
    const parent = medicaid.memberResults?.find((m) => m.memberId === 'self');
    const child = medicaid.memberResults?.find((m) => m.memberId === 'kid1');
    const pctSource = (steps: CalculationStep[] | undefined) =>
      steps?.find((s) => s.labelCode === C.LIMIT_PCT_OF_FPL)?.source?.field;
    expect(pctSource(parent?.calculation)).toBe('medicaid.parentCaretakerLimitPct');
    expect(pctSource(child?.calculation)).toBe('medicaid.childTiers');
  });

  it('builds the TANF limit from the base amount plus the per-person addition', () => {
    const tanf = program(evaluate(texasFamily, nonExpansionAdapter).results, 'tanf');
    const steps = tanf.calculation ?? [];
    expect(value(steps, C.TANF_BASE_LIMIT) + value(steps, C.TANF_PER_PERSON_ADDITION)).toBe(
      value(steps, C.MONTHLY_INCOME_LIMIT),
    );
  });
});
