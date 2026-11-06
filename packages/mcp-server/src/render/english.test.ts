import { describe, expect, it } from 'vitest';
import type { LocaleBundle } from '../data/loader.js';
import {
  EnglishRenderer,
  formatCents,
  formatDollarString,
  formatStepValue,
  humanize,
} from './english.js';

const bundle: LocaleBundle = {
  reasons: {
    OVER: 'Your income of {{income}} is over the limit of {{limit}}.',
    PROGRAM: 'No rules for {{program}} yet.',
  },
  factors: { SNAP_GROSS_INCOME: 'Monthly income' },
  steps: { STEP_APPLY: 'Apply now.' },
  math: { CALC_FPL_ANNUAL: 'Poverty line per year' },
  common: { outcome: { likely_eligible: 'You may well qualify' }, programs: { snap: 'SNAP' } },
};

const en = new EnglishRenderer(bundle);

describe('money formatting', () => {
  it('formats integer cents as USD', () => {
    expect(formatCents(123_456)).toBe('$1,234.56');
    expect(formatCents(0)).toBe('$0.00');
  });

  it('formats the engine dollar strings as USD', () => {
    expect(formatDollarString('1625.00')).toBe('$1,625.00');
    expect(formatDollarString('n/a')).toBe('n/a');
  });

  it('formats step values by unit', () => {
    expect(formatStepValue({ labelCode: 'X', value: 150_000, unit: 'cents', op: 'input' })).toBe(
      '$1,500.00',
    );
    expect(formatStepValue({ labelCode: 'X', value: 119.456, unit: 'pct', op: 'result' })).toBe(
      '119.5%',
    );
    expect(formatStepValue({ labelCode: 'X', value: 3, unit: 'count', op: 'input' })).toBe('3');
  });
});

describe('EnglishRenderer', () => {
  it('renders reasons with money params as USD and other params as-is', () => {
    expect(en.reason({ code: 'OVER', params: { income: 200_000, limit: 150_050 } })).toBe(
      'Your income of $2,000.00 is over the limit of $1,500.50.',
    );
    expect(en.reason({ code: 'PROGRAM', params: { program: 'ui' } })).toBe('No rules for ui yet.');
  });

  it('falls back to a humanized key when a string is missing', () => {
    expect(en.reason({ code: 'BRAND_NEW_REASON', params: {} })).toBe('Brand New Reason');
    expect(en.outcome('possibly_eligible')).toBe('Possibly Eligible');
    expect(en.programName('tanf')).toBe('Tanf');
  });

  it('resolves nested keys and every namespace', () => {
    expect(en.outcome('likely_eligible')).toBe('You may well qualify');
    expect(en.programName('snap')).toBe('SNAP');
    expect(en.factorLabel('SNAP_GROSS_INCOME')).toBe('Monthly income');
    expect(en.step('STEP_APPLY')).toBe('Apply now.');
    expect(
      en.stepLabel({ labelCode: 'CALC_FPL_ANNUAL', value: 1, unit: 'count', op: 'rule' }),
    ).toBe('Poverty line per year');
  });

  it('humanizes codes', () => {
    expect(humanize('CALC_SNAP_NET_INCOME')).toBe('Calc Snap Net Income');
  });
});
