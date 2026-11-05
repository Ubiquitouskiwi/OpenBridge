/**
 * Locale-agnostic age helpers (design §3.4). Ages are computed at an explicit
 * snapshot `evaluationDate` so saved profiles produce reproducible results.
 */
import type { HouseholdMember } from './types.js';

function parseIso(date: string): Date {
  // Interpret as a calendar date at UTC midnight to avoid timezone drift.
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/** Whole years between `dateOfBirth` and `asOf` (both ISO YYYY-MM-DD). */
export function ageInYears(dateOfBirth: string, asOf: string): number {
  const dob = parseIso(dateOfBirth);
  const at = parseIso(asOf);
  let years = at.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    at.getUTCMonth() < dob.getUTCMonth() ||
    (at.getUTCMonth() === dob.getUTCMonth() && at.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

/** Whole months between `dateOfBirth` and `asOf` (useful for infants under 2). */
export function ageInMonths(dateOfBirth: string, asOf: string): number {
  const dob = parseIso(dateOfBirth);
  const at = parseIso(asOf);
  let months =
    (at.getUTCFullYear() - dob.getUTCFullYear()) * 12 + (at.getUTCMonth() - dob.getUTCMonth());
  if (at.getUTCDate() < dob.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * Resolve a member's age in years: prefers `dateOfBirth`, falls back to `age`.
 * Returns undefined when neither is available.
 */
export function resolveAgeYears(member: HouseholdMember, asOf: string): number | undefined {
  if (member.dateOfBirth) return ageInYears(member.dateOfBirth, asOf);
  return member.age;
}

/**
 * Whether a resolved age sits within `marginYears` of a boundary age. Used to flag
 * age-only entries near a threshold as possibly_eligible (Q24).
 */
export function isNearAgeBoundary(
  member: HouseholdMember,
  boundaryAge: number,
  marginYears = 1,
): boolean {
  if (member.dateOfBirth) return false; // exact DOB needs no margin
  if (member.age === undefined) return false;
  return Math.abs(member.age - boundaryAge) <= marginYears;
}

/** True when `iso` is strictly before `asOf` (date-only comparison). */
export function isBefore(iso: string, asOf: string): boolean {
  return parseIso(iso).getTime() < parseIso(asOf).getTime();
}
