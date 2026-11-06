import { describe, it, expect } from 'vitest';
import type { StateAdapter } from './types.js';
import { findRuleField, readRuleValue, ruleFieldsFor } from './rule-fields.js';
import { type RuleProposal, RULE_PROPOSAL_FORMAT, applyRuleProposal } from './rule-proposal.js';

// Synthetic adapter: values are illustrative, not real rules.
function adapter(): StateAdapter {
  return {
    stateCode: 'ZZ',
    stateName: 'Example State',
    medicaidExpansion: true,
    programs: {
      snap: {
        bbce: false,
        grossIncomeLimitPct: 130,
        netIncomeLimitPct: 100,
        assetLimitCents: 275000,
        assetLimitElderlyDisabledCents: 425000,
        hasVehicleAssetTest: false,
      },
      medicaid: {
        expansion: true,
        adultLimitPct: 138,
        parentCaretakerLimitPct: 90,
        pregnantLimitPct: 200,
        childTiers: [
          { maxAgeInclusive: 1, limitPct: 206 },
          { maxAgeInclusive: 18, limitPct: 206 },
        ],
      },
    },
    portalUrls: {},
    sources: [
      {
        field: 'snap.grossIncomeLimitPct',
        sourceName: 'Old source',
        url: 'https://example.org/old',
        publishedDate: '2023-01-01',
      },
    ],
    verificationStatus: 'verified',
    lastVerified: '2024-01-01',
    lastVerifiedBy: 'example-reviewer',
  };
}

function proposal(overrides: Partial<RuleProposal> = {}): RuleProposal {
  return {
    format: RULE_PROPOSAL_FORMAT,
    stateCode: 'ZZ',
    changes: [{ field: 'snap.grossIncomeLimitPct', currentValue: 130, proposedValue: 200 }],
    source: {
      sourceName: 'New source',
      url: 'https://example.org/new',
      publishedDate: '2026-10-01',
    },
    explanation: 'The state adopted broad-based categorical eligibility.',
    ...overrides,
  };
}

describe('rule fields', () => {
  it('lists only configured programs and expands each Medicaid child tier', () => {
    const paths = ruleFieldsFor(adapter()).map((f) => f.path);
    expect(paths).toContain('medicaid.childTiers.1.limitPct');
    expect(paths.some((p) => p.startsWith('wic.'))).toBe(false);
    expect(findRuleField(adapter(), 'medicaid.childTiers.0.limitPct')?.sourceField).toBe(
      'medicaid.childTiers',
    );
  });

  it('reads values by path, including array tiers and nulls', () => {
    const a = adapter();
    expect(readRuleValue(a, 'medicaid.childTiers.1.limitPct')).toBe(206);
    expect(readRuleValue(a, 'snap.bbce')).toBe(false);
    expect(readRuleValue(a, 'snap.nope')).toBeUndefined();
  });
});

describe('applyRuleProposal', () => {
  it('sets the value, replaces the citation, and resets the adapter to draft', () => {
    const before = adapter();
    const { adapter: after, errors, applied } = applyRuleProposal(before, proposal());
    expect(errors).toEqual([]);
    expect(after.programs.snap?.grossIncomeLimitPct).toBe(200);
    expect(after.sources).toHaveLength(1);
    expect(after.sources[0]).toMatchObject({
      field: 'snap.grossIncomeLimitPct',
      sourceName: 'New source',
    });
    expect(after.verificationStatus).toBe('draft');
    expect(applied).toEqual(['snap.grossIncomeLimitPct: 130 -> 200']);
    expect(before.programs.snap?.grossIncomeLimitPct).toBe(130);
  });

  it('adds a new citation for a field that had none, keyed by its source field', () => {
    const { adapter: after } = applyRuleProposal(
      adapter(),
      proposal({
        changes: [
          { field: 'medicaid.childTiers.0.limitPct', currentValue: 206, proposedValue: 211 },
        ],
      }),
    );
    expect(after.programs.medicaid?.childTiers[0]?.limitPct).toBe(211);
    expect(after.sources.map((s) => s.field)).toContain('medicaid.childTiers');
  });

  it('allows null only where the field is nullable', () => {
    const ok = applyRuleProposal(
      adapter(),
      proposal({
        changes: [{ field: 'snap.netIncomeLimitPct', currentValue: 100, proposedValue: null }],
      }),
    );
    expect(ok.errors).toEqual([]);
    const bad = applyRuleProposal(
      adapter(),
      proposal({
        changes: [{ field: 'snap.grossIncomeLimitPct', currentValue: 130, proposedValue: null }],
      }),
    );
    expect(bad.errors.join(' ')).toMatch(/not a valid pct value/);
  });

  it('refuses a proposal made against an older value', () => {
    const result = applyRuleProposal(
      adapter(),
      proposal({
        changes: [{ field: 'snap.grossIncomeLimitPct', currentValue: 165, proposedValue: 200 }],
      }),
    );
    expect(result.errors.join(' ')).toMatch(/is 130 now/);
    expect(result.adapter.programs.snap?.grossIncomeLimitPct).toBe(130);
  });

  it('refuses the wrong state, unknown fields, fractional cents, and a missing source', () => {
    const errors = applyRuleProposal(
      adapter(),
      proposal({
        stateCode: 'YY',
        changes: [
          { field: 'snap.madeUp', currentValue: 1, proposedValue: 2 },
          { field: 'snap.assetLimitCents', currentValue: 275000, proposedValue: 2750.5 },
        ],
        source: { sourceName: '', url: '', publishedDate: '' },
      }),
    ).errors.join('\n');
    expect(errors).toMatch(/for YY/);
    expect(errors).toMatch(/snap.madeUp/);
    expect(errors).toMatch(/not a valid cents value/);
    expect(errors).toMatch(/source name, URL, and published date/);
  });
});
