import { findRuleField, ruleFieldsFor } from '@openbridge/shared';
import { loadAdapter } from '../data/index.js';
import { ohio, t } from '../test-utils.js';
import {
  fieldLabel,
  formatIsoDate,
  formatRuleValue,
  isoDateOf,
  markdownCell,
  parseDollarsToCents,
  parsePercent,
} from './format.js';

describe('formatRuleValue', () => {
  it('writes percents as a share of the poverty line', () => {
    expect(formatRuleValue(t, 'en', { unit: 'pct' }, 130)).toBe('130% of the poverty line');
    expect(formatRuleValue(t, 'en', { unit: 'pct' }, 137.5)).toBe('137.5% of the poverty line');
  });

  it('writes cents as dollars', () => {
    expect(formatRuleValue(t, 'en', { unit: 'cents' }, 275000)).toBe('$2,750.00');
    expect(formatRuleValue(t, 'en', { unit: 'cents' }, 0)).toBe('$0.00');
  });

  it('writes booleans and null in words', () => {
    expect(formatRuleValue(t, 'en', { unit: 'boolean' }, true)).toBe('Yes');
    expect(formatRuleValue(t, 'en', { unit: 'boolean' }, false)).toBe('No');
    expect(formatRuleValue(t, 'en', { unit: 'cents' }, null)).toBe('Not used');
  });
});

describe('parseDollarsToCents', () => {
  it.each([
    ['2750', 275000],
    ['$2,750', 275000],
    ['2,750.50', 275050],
    [' $ 1200.5 ', 120050],
    ['0.07', 7],
    ['.99', 99],
    ['0', 0],
    ['19.99', 1999],
  ])('reads %s as %d cents', (input, cents) => {
    expect(parseDollarsToCents(input)).toBe(cents);
  });

  it.each(['', 'abc', '-5', '1.234', '12a', '1,2.3.4', '$'])('refuses %s', (input) => {
    expect(parseDollarsToCents(input)).toBeUndefined();
  });
});

describe('parsePercent', () => {
  it('reads plain and percent-sign numbers', () => {
    expect(parsePercent('130')).toBe(130);
    expect(parsePercent('130%')).toBe(130);
    expect(parsePercent(' 137.5 % ')).toBe(137.5);
  });

  it('refuses words and negatives', () => {
    expect(parsePercent('one hundred')).toBeUndefined();
    expect(parsePercent('-1')).toBeUndefined();
    expect(parsePercent('')).toBeUndefined();
  });
});

describe('fieldLabel', () => {
  it('names child tier ages from the tier list', () => {
    const texas = loadAdapter('TX');
    if (!texas) throw new Error('missing TX');
    const tiers = ruleFieldsFor(texas).filter((f) => f.labelKey === 'medicaid.childTierLimitPct');
    expect(tiers.map((f) => fieldLabel(t, texas, f))).toEqual([
      'Income limit for children ages 0 to 1',
      'Income limit for children ages 2 to 5',
      'Income limit for children ages 6 to 18',
    ]);
  });

  it('uses the plain label for other fields', () => {
    const field = findRuleField(ohio(), 'snap.grossIncomeLimitPct');
    if (!field) throw new Error('missing field');
    expect(fieldLabel(t, ohio(), field)).toBe('Income limit before deductions');
  });

  it('has an English label for every field in every bundled state', () => {
    for (const code of ['OH', 'TX', 'WA']) {
      const adapter = loadAdapter(code);
      if (!adapter) throw new Error(`missing ${code}`);
      for (const field of ruleFieldsFor(adapter)) {
        expect(fieldLabel(t, adapter, field)).not.toContain('fields.');
      }
    }
  });
});

describe('dates and markdown', () => {
  it('formats ISO dates without a time zone shift', () => {
    expect(formatIsoDate('en-US', '2024-01-01')).toBe('Jan 1, 2024');
    expect(formatIsoDate('en-US', 'not a date')).toBe('not a date');
  });

  it('makes a local YYYY-MM-DD date', () => {
    expect(isoDateOf(new Date(2026, 10, 6, 23, 30))).toBe('2026-11-06');
  });

  it('escapes table cells', () => {
    expect(markdownCell('a | b\nc')).toBe('a \\| b c');
  });
});
