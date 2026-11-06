import { RULE_PROPOSAL_FORMAT, checkRuleProposal, findRuleField } from '@openbridge/shared';
import { ohio, t } from '../../test-utils.js';
import {
  type ChangeDraft,
  buildProposal,
  emptyChange,
  parseDraftValue,
  proposalFileName,
} from './buildProposal.js';
import { buildIssueText } from './issueText.js';

const source = {
  sourceName: 'Ohio SNAP Policy Manual',
  url: 'https://example.org/manual',
  publishedDate: '2025-10-01',
};

function draft(path: string, amount = '', choice: ChangeDraft['choice'] = ''): ChangeDraft {
  return { id: path, program: path.split('.')[0] ?? '', path, amount, choice };
}

function build(
  changes: ChangeDraft[],
  overrides: Partial<typeof source> = {},
  explanation = 'New table.',
) {
  return buildProposal({
    adapter: ohio(),
    changes,
    source: { ...source, ...overrides },
    explanation,
    toolkitVersion: '0.1.0',
  });
}

describe('buildProposal', () => {
  it('builds a proposal that passes checkRuleProposal, with values in stored units', () => {
    const result = build([
      draft('snap.grossIncomeLimitPct', '200%'),
      draft('tanf.baseMonthlyLimitCents', '$650.25'),
      draft('snap.bbce', '', 'no'),
      draft('snap.netIncomeLimitPct', '100'),
    ]);
    expect(result.proposal).toBeDefined();
    const proposal = result.proposal!;
    expect(proposal.format).toBe(RULE_PROPOSAL_FORMAT);
    expect(proposal.stateCode).toBe('OH');
    expect(proposal.createdWith).toBe('openbridge-rule-toolkit 0.1.0');
    expect(proposal.changes).toEqual([
      { field: 'snap.grossIncomeLimitPct', currentValue: 130, proposedValue: 200 },
      { field: 'tanf.baseMonthlyLimitCents', currentValue: 60000, proposedValue: 65025 },
      { field: 'snap.bbce', currentValue: true, proposedValue: false },
      { field: 'snap.netIncomeLimitPct', currentValue: null, proposedValue: 100 },
    ]);
    expect(checkRuleProposal(ohio(), proposal)).toEqual([]);
  });

  it('reports a code for each problem and makes no proposal', () => {
    const result = build(
      [
        emptyChange('blank'),
        draft('wic.incomeLimitPct', 'lots'),
        { ...draft('wic.incomeLimitPct', '190'), id: 'dupe' },
        draft('liheap.incomeLimitPct', '175'),
        draft('tanf.perAdditionalPersonCents', '1.234'),
        draft('medicaid.adultLimitPct', '', 'notUsed'),
      ],
      { sourceName: ' ', url: 'http://example.org', publishedDate: '2025-02-30' },
      '',
    );
    expect(result.proposal).toBeUndefined();
    expect(result.changeErrors).toEqual({
      blank: 'fieldRequired',
      'wic.incomeLimitPct': 'pctInvalid',
      dupe: 'duplicate',
      'liheap.incomeLimitPct': 'sameAsCurrent',
      'tanf.perAdditionalPersonCents': 'centsInvalid',
      'medicaid.adultLimitPct': 'valueInvalid',
    });
    expect(result.sourceErrors).toEqual({
      sourceName: 'required',
      url: 'notHttps',
      publishedDate: 'invalid',
    });
    expect(result.explanationError).toBe('required');
  });

  it('reads "Not used" as null only for nullable fields', () => {
    const nullable = findRuleField(ohio(), 'snap.assetLimitCents');
    const required = findRuleField(ohio(), 'tanf.baseMonthlyLimitCents');
    if (!nullable || !required) throw new Error('missing fields');
    expect(parseDraftValue(nullable, draft(nullable.path, '', 'notUsed'))).toEqual({ value: null });
    expect(parseDraftValue(required, draft(required.path, '', 'notUsed'))).toEqual({
      error: 'valueInvalid',
    });
  });

  it('needs a value for yes/no fields', () => {
    expect(build([draft('snap.bbce')]).changeErrors['snap.bbce']).toBe('valueRequired');
  });
});

describe('buildIssueText', () => {
  it('describes each change in natural units with the source and reason', () => {
    const proposal = build([
      draft('snap.grossIncomeLimitPct', '200'),
      draft('tanf.baseMonthlyLimitCents', '650'),
    ]).proposal!;
    const text = buildIssueText(
      t,
      'en-US',
      ohio(),
      proposal,
      'openbridge-proposal-oh-2026-11-06.json',
    );
    expect(text).toContain('## Rule correction for Ohio');
    expect(text).toContain(
      '- SNAP (food assistance), Income limit before deductions: change from 130% of the poverty ' +
        'line to 200% of the poverty line (`snap.grossIncomeLimitPct`)',
    );
    expect(text).toContain('change from $600.00 to $650.00');
    expect(text).toContain('- Name: Ohio SNAP Policy Manual');
    expect(text).toContain('- Link: https://example.org/manual');
    expect(text).toContain('- Published: Oct 1, 2025');
    expect(text).toContain('New table.');
    expect(text).toContain('openbridge-proposal-oh-2026-11-06.json');
  });
});

it('names the proposal file by state and date', () => {
  expect(proposalFileName('OH', '2026-11-06')).toBe('openbridge-proposal-oh-2026-11-06.json');
});
