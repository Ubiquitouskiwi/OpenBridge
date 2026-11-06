/**
 * Turns the Propose a rule change form into a `RuleProposal` (format
 * `openbridge.rule-proposal.v1`) that a maintainer applies with `npm run rules:apply`.
 * Pure: every check is a localizable error code; `checkRuleProposal` runs last as a backstop.
 */
import {
  RULE_PROPOSAL_FORMAT,
  checkRuleProposal,
  findRuleField,
  isValidRuleValue,
  readRuleValue,
} from '@openbridge/shared';
import type { RuleField, RuleProposal, RuleValue, StateAdapter } from '@openbridge/shared';
import { parseDollarsToCents, parsePercent } from '../../lib/format.js';

/** Limits match `scripts/apply-rule-proposal.ts`, so a file the toolkit makes always applies. */
export const SOURCE_NAME_MAX = 300;
export const EXPLANATION_MAX = 5000;

/** For numbers, '' means "use the amount"; for yes/no fields it holds the answer. */
export type ValueChoice = '' | 'yes' | 'no' | 'notUsed';

export interface ChangeDraft {
  id: string;
  program: string;
  path: string;
  amount: string;
  choice: ValueChoice;
}

export interface SourceDraft {
  sourceName: string;
  url: string;
  publishedDate: string;
}

export type ChangeError =
  | 'fieldRequired'
  | 'valueRequired'
  | 'pctInvalid'
  | 'centsInvalid'
  | 'valueInvalid'
  | 'duplicate'
  | 'sameAsCurrent';

export interface SourceErrors {
  sourceName?: 'required' | 'tooLong';
  url?: 'required' | 'notHttps';
  publishedDate?: 'required' | 'invalid';
}

export interface ProposalResult {
  proposal?: RuleProposal;
  changeErrors: Record<string, ChangeError | undefined>;
  sourceErrors: SourceErrors;
  explanationError?: 'required' | 'tooLong';
  /** Problems only the shared check found (should not happen once the form checks pass). */
  checkErrors: string[];
}

export function emptyChange(id: string): ChangeDraft {
  return { id, program: '', path: '', amount: '', choice: '' };
}

type Parsed = { value: RuleValue } | { error: ChangeError };

/** Reads the value an expert entered, in the field's natural units. */
export function parseDraftValue(field: RuleField, draft: ChangeDraft): Parsed {
  if (draft.choice === 'notUsed') {
    return field.nullable ? { value: null } : { error: 'valueInvalid' };
  }
  if (field.unit === 'boolean') {
    if (draft.choice === 'yes') return { value: true };
    if (draft.choice === 'no') return { value: false };
    return { error: 'valueRequired' };
  }
  if (draft.amount.trim() === '') return { error: 'valueRequired' };
  const value =
    field.unit === 'cents' ? parseDollarsToCents(draft.amount) : parsePercent(draft.amount);
  if (value === undefined) return { error: field.unit === 'cents' ? 'centsInvalid' : 'pctInvalid' };
  return isValidRuleValue(field, value) ? { value } : { error: 'valueInvalid' };
}

function isHttpsUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parsed = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text;
}

export function checkSource(source: SourceDraft): SourceErrors {
  const errors: SourceErrors = {};
  const name = source.sourceName.trim();
  if (!name) errors.sourceName = 'required';
  else if (name.length > SOURCE_NAME_MAX) errors.sourceName = 'tooLong';
  if (!source.url.trim()) errors.url = 'required';
  else if (!isHttpsUrl(source.url)) errors.url = 'notHttps';
  if (!source.publishedDate) errors.publishedDate = 'required';
  else if (!isIsoDate(source.publishedDate)) errors.publishedDate = 'invalid';
  return errors;
}

function checkExplanation(text: string): ProposalResult['explanationError'] {
  const trimmed = text.trim();
  if (!trimmed) return 'required';
  return trimmed.length > EXPLANATION_MAX ? 'tooLong' : undefined;
}

export interface ProposalInput {
  adapter: StateAdapter;
  changes: readonly ChangeDraft[];
  source: SourceDraft;
  explanation: string;
  toolkitVersion: string;
}

export function buildProposal(input: ProposalInput): ProposalResult {
  const { adapter } = input;
  const changeErrors: ProposalResult['changeErrors'] = {};
  const changes: RuleProposal['changes'] = [];
  const seen = new Set<string>();
  for (const draft of input.changes) {
    const field = draft.path ? findRuleField(adapter, draft.path) : undefined;
    if (!field) {
      changeErrors[draft.id] = 'fieldRequired';
      continue;
    }
    if (seen.has(field.path)) {
      changeErrors[draft.id] = 'duplicate';
      continue;
    }
    seen.add(field.path);
    const parsed = parseDraftValue(field, draft);
    if ('error' in parsed) {
      changeErrors[draft.id] = parsed.error;
      continue;
    }
    const currentValue = readRuleValue(adapter, field.path) ?? null;
    if (currentValue === parsed.value) {
      changeErrors[draft.id] = 'sameAsCurrent';
      continue;
    }
    changes.push({ field: field.path, currentValue, proposedValue: parsed.value });
  }

  const sourceErrors = checkSource(input.source);
  const explanationError = checkExplanation(input.explanation);
  const result: ProposalResult = { changeErrors, sourceErrors, explanationError, checkErrors: [] };
  const formOk =
    input.changes.length > 0 &&
    Object.values(changeErrors).every((e) => e === undefined) &&
    Object.keys(sourceErrors).length === 0 &&
    explanationError === undefined;
  if (!formOk) return result;

  const proposal: RuleProposal = {
    format: RULE_PROPOSAL_FORMAT,
    stateCode: adapter.stateCode,
    changes,
    source: {
      sourceName: input.source.sourceName.trim(),
      url: input.source.url.trim(),
      publishedDate: input.source.publishedDate,
    },
    explanation: input.explanation.trim(),
    createdWith: `openbridge-rule-toolkit ${input.toolkitVersion}`,
  };
  result.checkErrors = checkRuleProposal(adapter, proposal);
  if (result.checkErrors.length === 0) result.proposal = proposal;
  return result;
}

/** File name for the proposal, for example `openbridge-proposal-oh-2026-11-06.json`. */
export function proposalFileName(stateCode: string, date: string): string {
  return `openbridge-proposal-${stateCode.toLowerCase()}-${date}.json`;
}
