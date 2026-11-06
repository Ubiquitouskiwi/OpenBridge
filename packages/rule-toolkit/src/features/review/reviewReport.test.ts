import { ruleFieldsFor } from '@openbridge/shared';
import { ohio, t } from '../../test-utils.js';
import { buildReviewReport, countReview, reviewReportFileName } from './reviewReport.js';

const base = {
  t,
  locale: 'en-US',
  reviewer: { name: '', role: '' },
  date: '2026-11-06',
  toolkitVersion: '0.1.0',
  dataVersion: '2024',
};

describe('countReview', () => {
  it('counts each status and what is left', () => {
    const fields = ruleFieldsFor(ohio());
    const counts = countReview(fields, {
      'snap.bbce': { status: 'matches', note: '' },
      'snap.grossIncomeLimitPct': { status: 'mismatch', note: 'x' },
      'wic.incomeLimitPct': { status: 'unsure', note: '' },
      'tanf.baseMonthlyLimitCents': { note: 'note but no status' },
    });
    expect(counts).toEqual({
      matches: 1,
      mismatch: 1,
      unsure: 1,
      unchecked: fields.length - 3,
      total: fields.length,
    });
  });
});

describe('buildReviewReport', () => {
  it('lists every value with status, source, and notes, plus versions', () => {
    const adapter = ohio();
    const report = buildReviewReport({
      ...base,
      adapter,
      reviewer: { name: 'Pat Example', role: 'Caseworker' },
      entries: {
        'snap.grossIncomeLimitPct': { status: 'mismatch', note: 'Manual says 200 | not 130' },
      },
    });
    expect(report).toContain('# OpenBridge rule review: Ohio');
    expect(report).toContain('- Reviewer: Pat Example');
    expect(report).toContain('- Role: Caseworker');
    expect(report).toContain('- Rules status: draft');
    expect(report).toContain(`- Rules last checked: ${adapter.lastVerified}`);
    expect(report).toContain('- Toolkit version: 0.1.0');
    expect(report).toContain('- Rules data version: 2024');
    expect(report).toContain('- Does not match: 1');
    expect(report).toContain(
      '| SNAP (food assistance) | Income limit before deductions | 130% of the poverty line | ' +
        'Does not match | Ohio Dept. of Job and Family Services (BBCE), published Jan 1, 2024 ' +
        '(https://jfs.ohio.gov) | Manual says 200 \\| not 130 |',
    );
    expect(report).toContain('| Asset limit | Not used | Not checked yet | No source listed yet |');
    const rows = report.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| ---'));
    expect(rows).toHaveLength(ruleFieldsFor(adapter).length + 1);
  });

  it('leaves out reviewer lines when they are blank', () => {
    const report = buildReviewReport({ ...base, adapter: ohio(), entries: {} });
    expect(report).not.toContain('Reviewer:');
    expect(report).not.toContain('Role:');
  });
});

it('names the report file by state and date', () => {
  expect(reviewReportFileName('OH', '2026-11-06')).toBe('openbridge-review-oh-2026-11-06.md');
});
