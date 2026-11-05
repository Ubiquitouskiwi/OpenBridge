import { describe, it, expect } from 'vitest';
import { ageInYears, ageInMonths, resolveAgeYears, isNearAgeBoundary } from './date.js';
import type { HouseholdMember } from './types.js';

const asOf = '2026-07-02';

describe('date/age helpers', () => {
  it('computes whole years, respecting the birthday boundary', () => {
    expect(ageInYears('2000-07-02', asOf)).toBe(26);
    expect(ageInYears('2000-07-03', asOf)).toBe(25); // birthday not yet reached
    expect(ageInYears('2000-07-01', asOf)).toBe(26);
  });

  it('computes months for infants', () => {
    expect(ageInMonths('2026-01-02', asOf)).toBe(6);
    expect(ageInMonths('2025-07-02', asOf)).toBe(12);
    expect(ageInMonths('2026-07-02', asOf)).toBe(0);
  });

  it('prefers DOB but falls back to age', () => {
    const withDob: HouseholdMember = { id: 'a', relationship: 'self', dateOfBirth: '1990-01-01' };
    const withAge: HouseholdMember = { id: 'b', relationship: 'child', age: 4 };
    const neither: HouseholdMember = { id: 'c', relationship: 'child' };
    expect(resolveAgeYears(withDob, asOf)).toBe(36);
    expect(resolveAgeYears(withAge, asOf)).toBe(4);
    expect(resolveAgeYears(neither, asOf)).toBeUndefined();
  });

  it('flags age-only entries near a boundary, but not DOB entries', () => {
    const ageOnly: HouseholdMember = { id: 'b', relationship: 'child', age: 5 };
    const dob: HouseholdMember = { id: 'a', relationship: 'child', dateOfBirth: '2021-07-02' };
    expect(isNearAgeBoundary(ageOnly, 5)).toBe(true);
    expect(isNearAgeBoundary(ageOnly, 19)).toBe(false);
    expect(isNearAgeBoundary(dob, 5)).toBe(false);
  });
});
