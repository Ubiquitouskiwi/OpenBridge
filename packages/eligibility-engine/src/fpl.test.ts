import { describe, it, expect } from 'vitest';
import type { FplTable } from '@openbridge/shared';
import { regionForState, calculateFplAnnualCents } from './fpl.js';

const contiguous: FplTable = {
  region: 'contiguous',
  year: 2026,
  baseAnnualCents: 1560000, // $15,600 one-person (illustrative)
  perAdditionalPersonCents: 552000, // $5,520 per additional
  effectiveDate: '2026-01-15',
  expectedRefreshDate: '2027-01-31',
};

describe('regionForState', () => {
  it('maps AK/HI and defaults to contiguous', () => {
    expect(regionForState('AK')).toBe('alaska');
    expect(regionForState('hi')).toBe('hawaii');
    expect(regionForState('OH')).toBe('contiguous');
    expect(regionForState(' tx ')).toBe('contiguous');
  });
});

describe('calculateFplAnnualCents', () => {
  it('scales base + increment by household size', () => {
    expect(calculateFplAnnualCents(1, contiguous)).toBe(1560000);
    expect(calculateFplAnnualCents(3, contiguous)).toBe(1560000 + 2 * 552000);
    expect(calculateFplAnnualCents(0, contiguous)).toBe(1560000); // clamps to 1
  });
});
