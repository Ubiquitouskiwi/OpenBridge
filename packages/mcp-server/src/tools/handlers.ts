/**
 * Tool handlers. Read-only and deterministic: they never log arguments, store anything, or
 * make network calls (privacy-security.md). The household lives only in this call's memory.
 * The evaluation date defaults to today's UTC date here, never inside the engine (rule 3).
 */
import type { CallToolResult } from '@modelcontextprotocol/server';
import {
  DEFAULT_CLIFF_SCAN_MAX_CENTS,
  DEFAULT_CLIFF_SCAN_STEP_CENTS,
  evaluateEligibility,
  evaluateIncomeScenarios,
  findIncomeCliffs,
  regionForState,
} from '@openbridge/eligibility-engine';
import type { HouseholdProfile, StateAdapter } from '@openbridge/shared';
import { HELP_LINE } from '../copy.js';
import type { ReferenceData } from '../data/loader.js';
import type { EnglishRenderer } from '../render/english.js';
import {
  getStateRules,
  listSupportedStates,
  stateRulesText,
  supportedStateCodes,
  supportedStatesText,
} from '../render/rules.js';
import { incomeChangeText, renderIncomeChange } from '../render/scenarios.js';
import { renderScreening, screeningText } from '../render/screening.js';
import type { HouseholdInput } from './inputSchemas.js';

/**
 * Default "what if" income changes, in cents per month: a $250, $500, and $1,000 raise.
 * A product choice for a quick overview, not an eligibility value.
 */
export const DEFAULT_SCENARIO_DELTAS_CENTS = [25_000, 50_000, 100_000];

export interface ToolContext {
  data: ReferenceData;
  en: EnglishRenderer;
  /** Injectable clock, used only to default the evaluation date. */
  now: () => Date;
}

export function todayUtc(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function ok(text: string, structured: object): CallToolResult {
  return {
    content: [{ type: 'text', text }],
    structuredContent: structured as Record<string, unknown>,
  };
}

function toolError(text: string, structured: Record<string, unknown>): CallToolResult {
  return { content: [{ type: 'text', text }], structuredContent: structured, isError: true };
}

/** An `isError` result for an unsupported state; never throws. */
export function unsupportedState(ctx: ToolContext, stateCode: string): CallToolResult {
  const supported = supportedStateCodes(ctx.data);
  return toolError(
    `OpenBridge does not have rules for "${stateCode.toUpperCase()}" yet. Supported states: ` +
      `${supported.join(', ')}. The person may still qualify for help. ${HELP_LINE}`,
    { error: 'unsupported_state', supportedStates: supported, help: HELP_LINE },
  );
}

/** A generic failure that never echoes household data back. */
function internalError(): CallToolResult {
  return toolError(
    'OpenBridge could not finish this estimate. Please check the inputs and try again. ' +
      HELP_LINE,
    { error: 'internal_error', help: HELP_LINE },
  );
}

function findAdapter(ctx: ToolContext, stateCode: string): StateAdapter | undefined {
  return ctx.data.adapters.get(stateCode.toUpperCase());
}

/** Build the engine profile; derived fields are placeholders the engine recomputes. */
export function toProfile(h: HouseholdInput): HouseholdProfile {
  const stateCode = h.stateCode.toUpperCase();
  return {
    ...h,
    stateCode,
    county: h.county ?? '',
    grossMonthlyIncomeCents: 0,
    fplRegion: regionForState(stateCode),
  };
}

export function listSupportedStatesTool(ctx: ToolContext): CallToolResult {
  const s = listSupportedStates(ctx.data);
  return ok(supportedStatesText(ctx.en, s), s);
}

export function getProgramRulesTool(ctx: ToolContext, args: { stateCode: string }): CallToolResult {
  const adapter = findAdapter(ctx, args.stateCode);
  if (!adapter) return unsupportedState(ctx, args.stateCode);
  const rules = getStateRules(adapter, ctx.data.federal);
  return ok(stateRulesText(ctx.en, rules), rules);
}

export function screenHouseholdTool(
  ctx: ToolContext,
  args: { household: HouseholdInput; evaluationDate?: string | undefined },
): CallToolResult {
  const adapter = findAdapter(ctx, args.household.stateCode);
  if (!adapter) return unsupportedState(ctx, args.household.stateCode);
  const evaluationDate = args.evaluationDate ?? todayUtc(ctx.now());
  try {
    const result = evaluateEligibility(
      toProfile(args.household),
      adapter,
      ctx.data.federal,
      evaluationDate,
    );
    const rendered = renderScreening(ctx.en, { adapter, federal: ctx.data.federal }, result);
    return ok(screeningText(rendered), rendered);
  } catch {
    return internalError();
  }
}

export interface IncomeChangeArgs {
  household: HouseholdInput;
  evaluationDate?: string | undefined;
  deltasMonthlyCents?: number[] | undefined;
  scanMaxIncreaseCents?: number | undefined;
  scanStepCents?: number | undefined;
}

export function exploreIncomeChangeTool(ctx: ToolContext, args: IncomeChangeArgs): CallToolResult {
  const adapter = findAdapter(ctx, args.household.stateCode);
  if (!adapter) return unsupportedState(ctx, args.household.stateCode);
  const evaluationDate = args.evaluationDate ?? todayUtc(ctx.now());
  const scan = {
    maxIncreaseCents: args.scanMaxIncreaseCents ?? DEFAULT_CLIFF_SCAN_MAX_CENTS,
    stepCents: args.scanStepCents ?? DEFAULT_CLIFF_SCAN_STEP_CENTS,
  };
  const deltas = [0, ...(args.deltasMonthlyCents ?? DEFAULT_SCENARIO_DELTAS_CENTS)];
  try {
    const profile = toProfile(args.household);
    const { federal } = ctx.data;
    const scenarios = evaluateIncomeScenarios(profile, adapter, federal, evaluationDate, [
      ...new Set(deltas),
    ]);
    const cliffs = findIncomeCliffs(profile, adapter, federal, evaluationDate, scan);
    const rendered = renderIncomeChange(ctx.en, {
      stateCode: adapter.stateCode,
      evaluationDate,
      scan,
      scenarios,
      cliffs,
    });
    return ok(incomeChangeText(rendered), rendered);
  } catch {
    return internalError();
  }
}
