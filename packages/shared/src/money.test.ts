import { describe, it, expect } from 'vitest';
import { toCents, fromCents, percentOfCents, asPercentOf, monthlyToAnnualCents } from './money.js';

describe('money', () => {
  it('converts dollars to cents with rounding', () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(10.005)).toBe(1001);
    expect(toCents(0)).toBe(0);
  });

  it('converts cents back to dollars', () => {
    expect(fromCents(1000)).toBe(10);
    expect(fromCents(1)).toBe(0.01);
  });

  it('computes a percentage of a cent value', () => {
    expect(percentOfCents(10000, 130)).toBe(13000);
    expect(percentOfCents(10000, 100)).toBe(10000);
  });

  it('expresses a value as a percentage of a base', () => {
    expect(asPercentOf(13000, 10000)).toBe(130);
    expect(asPercentOf(5000, 0)).toBe(0);
  });

  it('annualizes monthly cents', () => {
    expect(monthlyToAnnualCents(100000)).toBe(1200000);
  });
});
