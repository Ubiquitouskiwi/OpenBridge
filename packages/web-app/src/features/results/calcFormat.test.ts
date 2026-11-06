import { describe, it, expect } from 'vitest';
import type { ProvenanceSource } from '@openbridge/shared';
import { findCitation, formatIsoDate, formatStepValue, formatWholeDollars } from './calcFormat.js';

function src(field: string, sourceName = `Source for ${field}`): ProvenanceSource {
  return { field, sourceName, url: 'https://example.gov/rules', publishedDate: '2024-01-17' };
}

describe('formatStepValue', () => {
  it('formats cents as USD, pct as a whole percent, and counts as numbers', () => {
    expect(formatStepValue('en', { value: 163150, unit: 'cents' })).toBe('$1,631.50');
    expect(formatStepValue('en', { value: 130, unit: 'pct' })).toBe('130%');
    expect(formatStepValue('en', { value: 138.4, unit: 'pct' })).toBe('138%');
    expect(formatStepValue('en', { value: 3, unit: 'count' })).toBe('3');
  });
});

describe('formatWholeDollars', () => {
  it('rounds to whole dollars', () => {
    expect(formatWholeDollars('en', 65_000)).toBe('$650');
    expect(formatWholeDollars('en', 300_000)).toBe('$3,000');
  });
});

describe('formatIsoDate', () => {
  it('does not shift the day by time zone', () => {
    expect(formatIsoDate('en', '2024-01-17')).toBe('Jan 17, 2024');
  });
});

describe('findCitation', () => {
  const adapter = { sources: [src('snap'), src('snap.grossIncomeLimitPct', 'Exact')] };
  const federal = { sources: [src('fplTables')] };

  it('prefers an exact field match', () => {
    const c = findCitation({ scope: 'state', field: 'snap.grossIncomeLimitPct' }, adapter, federal);
    expect(c?.sourceName).toBe('Exact');
  });

  it('matches when one field is a dotted parent of the other', () => {
    const c = findCitation({ scope: 'federal', field: 'fplTables.contiguous' }, adapter, federal);
    expect(c?.field).toBe('fplTables');
  });

  it('does not match a field that only shares leading letters', () => {
    expect(findCitation({ scope: 'state', field: 'snapshot' }, adapter, federal)).toBeUndefined();
  });

  it('looks only in the scope the step names', () => {
    expect(findCitation({ scope: 'federal', field: 'snap' }, adapter, federal)).toBeUndefined();
    expect(findCitation({ scope: 'state', field: 'tanf.x' }, undefined, federal)).toBeUndefined();
  });
});
