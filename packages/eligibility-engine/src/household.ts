/**
 * Per-program household derivation (requirements §7, design §3.3, Q1/Q37/Q38).
 *
 * Each program defines "household" differently. Phase 1 derives the SNAP unit and the
 * Medicaid MAGI household from the shared roster. The MAGI algorithm uses explicit tax
 * signals when present and otherwise falls back to a relationship/age approximation of
 * the non-filer rule, marking the result `assumed` so the Medicaid evaluator can apply a
 * cautious downgrade when the assumption could change the outcome.
 */
import type { HouseholdMember } from '@openbridge/shared';
import { resolveAgeYears } from '@openbridge/shared';

export interface DerivedHousehold {
  memberIds: string[];
  /** Size including any pregnancy bump (a pregnant member counts as 1 + expectedChildren). */
  size: number;
  /** True when the household was inferred without explicit tax signals. */
  assumed: boolean;
}

const CHILD_AGE_MAX = 18; // "under 19"
const SNAP_FORCED_CHILD_MAX = 21; // spouses + children under 22 must be in the SNAP unit

/**
 * The spouse of `member`, when identifiable from applicant-relative relationships:
 * the applicant's ('self') spouse is the member marked 'spouse', and vice versa.
 * For anyone else the roster carries no spouse signal, so this returns undefined.
 */
function spouseOf(
  member: HouseholdMember,
  members: HouseholdMember[],
): HouseholdMember | undefined {
  if (member.relationship === 'self') return members.find((m) => m.relationship === 'spouse');
  if (member.relationship === 'spouse') return members.find((m) => m.relationship === 'self');
  return undefined;
}

/** Unborn-children count for pregnant members among `ids` (used by MAGI and WIC sizes). */
export function pregnancyBump(members: HouseholdMember[], ids: string[]): number {
  const set = new Set(ids);
  return members
    .filter((m) => set.has(m.id) && m.isPregnant)
    .reduce((sum, m) => sum + Math.max(1, m.expectedChildren ?? 1), 0);
}

/**
 * SNAP household: people who purchase and prepare food together. Phase 1 proxy — everyone
 * on the roster is one unit unless explicitly marked as separate, but the applicant's
 * spouse and children under 22 are always included.
 */
export function deriveSnapHousehold(members: HouseholdMember[], asOf: string): DerivedHousehold {
  const ids = members
    .filter((m) => {
      const forced =
        m.relationship === 'self' ||
        m.relationship === 'spouse' ||
        (m.relationship === 'child' && (resolveAgeYears(m, asOf) ?? 99) <= SNAP_FORCED_CHILD_MAX);
      return forced || m.purchasesPreparesSeparately !== true;
    })
    .map((m) => m.id);
  // SNAP does not count an unborn child toward household size.
  return { memberIds: ids, size: ids.length, assumed: false };
}

/**
 * Medicaid MAGI household for a single member. Returns the member ids in that person's
 * MAGI household plus a size that includes the pregnancy bump.
 */
export function deriveMagiHousehold(
  targetId: string,
  members: HouseholdMember[],
  asOf: string,
): DerivedHousehold {
  const byId = new Map(members.map((m) => [m.id, m]));
  const target = byId.get(targetId);
  if (!target) return { memberIds: [], size: 0, assumed: true };

  const hasTaxSignals =
    target.filesTaxes !== undefined || target.claimedAsDependentBy !== undefined;

  // Explicit filer branch.
  if (target.filesTaxes === true && !target.claimedAsDependentBy) {
    const ids = new Set<string>([target.id]);
    const spouse = spouseOf(target, members);
    if (spouse) ids.add(spouse.id);
    for (const m of members) {
      if (m.claimedAsDependentBy === target.id) ids.add(m.id);
    }
    // Relationships are applicant-relative, so a filer who is neither the applicant nor
    // the applicant's spouse may have a spouse we cannot identify — mark it assumed.
    const spouseIdentifiable = target.relationship === 'self' || target.relationship === 'spouse';
    return finalize(members, ids, !spouseIdentifiable);
  }

  // Explicit dependent branch: use the claimant's filer household.
  if (target.claimedAsDependentBy) {
    const claimantId = target.claimedAsDependentBy;
    const ids = new Set<string>([target.id, claimantId]);
    const claimant = byId.get(claimantId);
    const claimantSpouse = claimant ? spouseOf(claimant, members) : undefined;
    if (claimantSpouse) ids.add(claimantSpouse.id);
    for (const m of members) {
      if (m.claimedAsDependentBy === claimantId) ids.add(m.id);
    }
    const spouseIdentifiable =
      claimant !== undefined &&
      (claimant.relationship === 'self' || claimant.relationship === 'spouse');
    return finalize(members, ids, !spouseIdentifiable);
  }

  // Non-filer rule (also the approximation used when tax signals are absent).
  const ids = nonFilerHousehold(target, members, asOf);
  return finalize(members, ids, !hasTaxSignals);
}

function nonFilerHousehold(
  target: HouseholdMember,
  members: HouseholdMember[],
  asOf: string,
): Set<string> {
  const ids = new Set<string>([target.id]);
  const isChild =
    target.relationship === 'child' && (resolveAgeYears(target, asOf) ?? 99) <= CHILD_AGE_MAX;

  if (isChild) {
    // Child's household: the child + parents + siblings under 19 living together.
    for (const m of members) {
      if (m.relationship === 'self' || m.relationship === 'spouse' || m.relationship === 'parent') {
        ids.add(m.id);
      }
      if (m.relationship === 'child' && (resolveAgeYears(m, asOf) ?? 99) <= CHILD_AGE_MAX) {
        ids.add(m.id);
      }
    }
    return ids;
  }

  // Adult (self/spouse): self + spouse + own children under 19.
  if (target.relationship === 'self' || target.relationship === 'spouse') {
    for (const m of members) {
      if (m.relationship === 'self' || m.relationship === 'spouse') ids.add(m.id);
      if (m.relationship === 'child' && (resolveAgeYears(m, asOf) ?? 99) <= CHILD_AGE_MAX) {
        ids.add(m.id);
      }
    }
    return ids;
  }

  // Other relatives (parent/grandparent/etc.): treated as their own unit in Phase 1.
  return ids;
}

function finalize(
  members: HouseholdMember[],
  ids: Set<string>,
  assumed: boolean,
): DerivedHousehold {
  const memberIds = [...ids];
  const size = memberIds.length + pregnancyBump(members, memberIds);
  return { memberIds, size, assumed };
}
