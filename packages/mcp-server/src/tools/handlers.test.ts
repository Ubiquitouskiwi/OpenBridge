import { describe, expect, it } from 'vitest';
import { DISCLAIMER } from '../copy.js';
import type { RenderedIncomeChange } from '../render/scenarios.js';
import type { RenderedScreening } from '../render/screening.js';
import type { StateRules, SupportedStates } from '../render/rules.js';
import { createToolContext } from '../server.js';
import { EVAL_DATE, familyHousehold, testAssets } from '../testsupport/fixtures.js';
import {
  exploreIncomeChangeTool,
  getProgramRulesTool,
  listSupportedStatesTool,
  screenHouseholdTool,
  todayUtc,
} from './handlers.js';
import { householdSchema } from './inputSchemas.js';

const ctx = createToolContext(testAssets(), { now: () => new Date('2024-07-04T23:30:00Z') });

function text(result: { content: unknown[] }): string {
  const first = result.content[0] as { type: string; text: string };
  return first.text;
}

describe('list_supported_states', () => {
  it('lists states, programs, verification status, and the data version', () => {
    const r = listSupportedStatesTool(ctx);
    const s = r.structuredContent as unknown as SupportedStates;
    expect(s.states).toEqual([
      {
        code: 'OH',
        name: 'Testland',
        programs: ['snap', 'medicaid', 'wic', 'tanf'],
        verificationStatus: 'draft',
        lastVerified: '2024-05-01',
      },
    ]);
    expect(s.dataVersion).toBe('2024');
    expect(text(r)).toContain('draft, not yet verified');
  });
});

describe('get_program_rules', () => {
  it('returns values with citations and flags draft rules and uncited fields', () => {
    const r = getProgramRulesTool(ctx, { stateCode: 'oh' });
    expect(r.isError).toBeUndefined();
    const rules = r.structuredContent as unknown as StateRules;
    expect(rules.isDraft).toBe(true);
    const snap = rules.programs.find((p) => p.programId === 'snap');
    expect(snap?.sources.map((s) => s.field)).toEqual(['snap.grossIncomeLimitPct']);
    const tanf = rules.programs.find((p) => p.programId === 'tanf');
    expect(tanf?.uncitedFields).toContain('tanf.baseMonthlyLimitCents');
    expect(text(r)).toMatch(/^DRAFT/m);
    expect(text(r)).toContain('tanf.baseMonthlyLimitCents: no citation listed yet');
  });

  it('returns isError for an unsupported state', () => {
    const r = getProgramRulesTool(ctx, { stateCode: 'ZZ' });
    expect(r.isError).toBe(true);
    expect(text(r)).toContain('Supported states: OH');
  });
});

describe('screen_household', () => {
  it('screens a supported state with reasons, math, citations, and members', () => {
    const r = screenHouseholdTool(ctx, { household: familyHousehold(), evaluationDate: EVAL_DATE });
    expect(r.isError).toBeUndefined();
    const s = r.structuredContent as unknown as RenderedScreening;
    expect(s.evaluationDate).toBe(EVAL_DATE);
    expect(s.disclaimer).toBe(DISCLAIMER);
    expect(s.programs.map((p) => p.programId)).toEqual([
      'snap',
      'medicaid',
      'wic',
      'liheap',
      'tanf',
    ]);

    const snap = s.programs.find((p) => p.programId === 'snap');
    expect(snap?.reasons.every((x) => x.text.length > 0)).toBe(true);
    const cited = snap?.calculation.find((c) => c.source?.field === 'snap.grossIncomeLimitPct');
    expect(cited?.citation).toMatchObject({ sourceName: 'Test SNAP Agency' });

    const tanf = s.programs.find((p) => p.programId === 'tanf');
    const uncited = tanf?.calculation.find((c) => c.source?.field === 'tanf.baseMonthlyLimitCents');
    expect(uncited?.citation).toBeNull();

    const medicaid = s.programs.find((p) => p.programId === 'medicaid');
    expect(medicaid?.memberResults?.map((m) => m.memberId).sort()).toEqual(['kid1', 'self']);

    const t = text(r);
    expect(t).toContain('$1,500.00 per month');
    expect(t).toContain(
      '[source: Test SNAP Agency, https://example.org/snap, published 2024-01-01]',
    );
    expect(t).toContain('[source: no citation listed yet]');
    expect(t).toContain('Person "kid1"');
    expect(t).toContain('Apply: https://example.org/apply');
    expect(t).toContain('DRAFT');
    expect(t).toContain(DISCLAIMER);
  });

  it("defaults the evaluation date to today's UTC date from the server clock", () => {
    const r = screenHouseholdTool(ctx, { household: familyHousehold() });
    expect((r.structuredContent as unknown as RenderedScreening).evaluationDate).toBe('2024-07-04');
    expect(todayUtc(new Date('2024-12-31T23:59:59Z'))).toBe('2024-12-31');
  });

  it('returns isError naming the supported states and 211 for an unsupported state', () => {
    const r = screenHouseholdTool(ctx, {
      household: familyHousehold({ stateCode: 'ZZ' }),
      evaluationDate: EVAL_DATE,
    });
    expect(r.isError).toBe(true);
    expect(text(r)).toContain('Supported states: OH');
    expect(text(r)).toContain('211');
    expect(text(r)).not.toContain('kid1');
  });

  it('keeps the disclaimer even when nothing looks likely', () => {
    const rich = familyHousehold({
      incomeSources: [
        { type: 'wages', amountCents: 2_000_000, frequency: 'monthly', earned: true },
      ],
    });
    const r = screenHouseholdTool(ctx, { household: rich, evaluationDate: EVAL_DATE });
    expect(text(r)).toContain(DISCLAIMER);
  });
});

describe('explore_income_change', () => {
  it('returns scenarios and per-program and per-member cliffs with summaries', () => {
    const r = exploreIncomeChangeTool(ctx, {
      household: familyHousehold(),
      evaluationDate: EVAL_DATE,
      deltasMonthlyCents: [50_000],
      scanMaxIncreaseCents: 300_000,
      scanStepCents: 10_000,
    });
    const s = r.structuredContent as unknown as RenderedIncomeChange;
    expect(s.scenarios.map((x) => x.deltaMonthlyCents)).toEqual([0, 50_000]);
    expect(s.scenarios[1]?.summary).toContain('With $500.00 more per month');
    expect(s.cliffs.some((c) => c.memberId === 'kid1')).toBe(true);
    expect(s.cliffs.some((c) => c.memberId === undefined)).toBe(true);
    expect(s.cliffs.every((c) => c.summary.length > 0)).toBe(true);
    expect(text(r)).toContain(DISCLAIMER);
  });

  it('returns isError for an unsupported state', () => {
    const r = exploreIncomeChangeTool(ctx, {
      household: familyHousehold({ stateCode: 'ZZ' }),
      evaluationDate: EVAL_DATE,
    });
    expect(r.isError).toBe(true);
  });
});

describe('household input schema', () => {
  it('accepts a minimal household and rejects a name-like member id', () => {
    expect(householdSchema.safeParse(familyHousehold()).success).toBe(true);
    const named = familyHousehold({ members: [{ id: 'Jane Doe', relationship: 'self', age: 30 }] });
    expect(householdSchema.safeParse(named).success).toBe(false);
  });

  it('rejects fractional cents and impossible dates', () => {
    const fractional = familyHousehold({
      incomeSources: [{ type: 'wages', amountCents: 10.5, frequency: 'monthly', earned: true }],
    });
    expect(householdSchema.safeParse(fractional).success).toBe(false);
    const badDob = familyHousehold({
      members: [{ id: 'self', relationship: 'self', dateOfBirth: '2024-02-30' }],
    });
    expect(householdSchema.safeParse(badDob).success).toBe(false);
  });
});
