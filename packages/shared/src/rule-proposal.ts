/**
 * Rule-change proposals: the file a policy or legal expert makes with the community rule
 * toolkit, and that a maintainer applies with `npm run rules:apply`. Pure functions only.
 *
 * Applying a proposal never marks anything verified: it always leaves the adapter `draft`,
 * because only a subject-matter expert sign-off can verify rules (AGENTS.md rule 6).
 */
import type { ProvenanceSource, StateAdapter } from './types.js';
import { type RuleValue, findRuleField, isValidRuleValue, readRuleValue } from './rule-fields.js';

export const RULE_PROPOSAL_FORMAT = 'openbridge.rule-proposal.v1';

export interface RuleChange {
  field: string;
  /** The value the expert saw; used to detect a proposal made against older data. */
  currentValue: RuleValue;
  proposedValue: RuleValue;
}

export interface RuleProposal {
  format: typeof RULE_PROPOSAL_FORMAT;
  stateCode: string;
  changes: RuleChange[];
  source: Omit<ProvenanceSource, 'field'>;
  /** Why the change is needed, in the expert's words. */
  explanation: string;
  /** Toolkit version that produced the file, for support. */
  createdWith?: string;
}

export interface ApplyResult {
  adapter: StateAdapter;
  /** Problems that stop the proposal from being applied. Empty means success. */
  errors: string[];
  /** Human-readable summary of each applied change. */
  applied: string[];
}

function setByPath(target: Record<string, unknown>, path: string, value: RuleValue): void {
  const segments = path.split('.');
  let node: Record<string, unknown> = target;
  for (const segment of segments.slice(0, -1)) {
    node = node[segment] as Record<string, unknown>;
  }
  node[segments[segments.length - 1] as string] = value;
}

/** Problems with a proposal against this adapter, without changing anything. */
export function checkRuleProposal(adapter: StateAdapter, proposal: RuleProposal): string[] {
  const errors: string[] = [];
  if (proposal.stateCode.toUpperCase() !== adapter.stateCode.toUpperCase()) {
    errors.push(`Proposal is for ${proposal.stateCode}, but the adapter is ${adapter.stateCode}.`);
  }
  if (proposal.changes.length === 0) errors.push('Proposal has no changes.');
  if (!proposal.source.url || !proposal.source.sourceName || !proposal.source.publishedDate) {
    errors.push('Proposal needs a source name, URL, and published date.');
  }
  const seen = new Set<string>();
  for (const change of proposal.changes) {
    const field = findRuleField(adapter, change.field);
    if (!field) {
      errors.push(`"${change.field}" is not a rule value this adapter has.`);
      continue;
    }
    if (seen.has(change.field)) errors.push(`"${change.field}" appears more than once.`);
    seen.add(change.field);
    if (!isValidRuleValue(field, change.proposedValue)) {
      errors.push(
        `"${change.field}": ${String(change.proposedValue)} is not a valid ${field.unit} value.`,
      );
    }
    const current = readRuleValue(adapter, change.field);
    if (current !== change.currentValue) {
      errors.push(
        `"${change.field}" is ${String(current)} now, but the proposal was made when it was ` +
          `${String(change.currentValue)}. Ask for a new proposal from the current rules.`,
      );
    }
  }
  return errors;
}

/**
 * Apply a proposal to a copy of the adapter: set each value, add or replace the citation for
 * each changed field, and keep the adapter `draft`. Returns errors instead of applying when
 * anything does not check out.
 */
export function applyRuleProposal(adapter: StateAdapter, proposal: RuleProposal): ApplyResult {
  const errors = checkRuleProposal(adapter, proposal);
  if (errors.length > 0) return { adapter, errors, applied: [] };

  const next = JSON.parse(JSON.stringify(adapter)) as StateAdapter;
  const applied: string[] = [];
  for (const change of proposal.changes) {
    const field = findRuleField(next, change.field);
    if (!field) continue;
    setByPath(next.programs as Record<string, unknown>, change.field, change.proposedValue);
    const citation: ProvenanceSource = { field: field.sourceField, ...proposal.source };
    const existing = next.sources.findIndex((s) => s.field === field.sourceField);
    if (existing >= 0) next.sources[existing] = citation;
    else next.sources.push(citation);
    applied.push(
      `${change.field}: ${String(change.currentValue)} -> ${String(change.proposedValue)}`,
    );
  }
  // Any rule change needs fresh expert review (AGENTS.md rule 6).
  next.verificationStatus = 'draft';
  return { adapter: next, errors: [], applied };
}
