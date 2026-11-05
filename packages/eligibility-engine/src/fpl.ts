/**
 * Federal Poverty Level helpers (requirements §7, Q4/Q23/Q38).
 */
import type { FplRegion, FplTable } from '@openbridge/shared';

const ALASKA = 'AK';
const HAWAII = 'HI';

/** Region is a pure function of the state code (Q23). */
export function regionForState(stateCode: string): FplRegion {
  const code = stateCode.trim().toUpperCase();
  if (code === ALASKA) return 'alaska';
  if (code === HAWAII) return 'hawaii';
  return 'contiguous';
}

/**
 * Annual FPL (in cents) for a household of `householdSize` using the given table.
 * HHS defines FPL as a base for one person plus a fixed increment per additional person.
 */
export function calculateFplAnnualCents(householdSize: number, table: FplTable): number {
  const size = Math.max(1, Math.floor(householdSize));
  return table.baseAnnualCents + (size - 1) * table.perAdditionalPersonCents;
}
