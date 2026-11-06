/**
 * Pure summary logic for the what-if / benefit cliff tool. Turns engine scenario output
 * into rows and plain-language sentences; components only render what this returns.
 */
import type { i18n as I18n } from 'i18next';
import type { EligibilityOutcome, HouseholdProfile, ProgramId } from '@openbridge/shared';
import type { IncomeCliff, IncomeScenario } from '@openbridge/eligibility-engine';
import { formatWholeDollars } from '../results/calcFormat.js';
import { memberLabel } from '../results/memberLabel.js';

/** Quick-pick monthly raises offered as buttons, in cents. */
export const QUICK_INCREASES_CENTS = [10_000, 25_000, 50_000] as const;

export interface ScenarioRow {
  programId: ProgramId;
  nowOutcome: EligibilityOutcome;
  changedOutcome: EligibilityOutcome;
  nowBenefitCents?: number;
  changedBenefitCents?: number;
}

/** Pairs each program's baseline result with its result under the change. */
export function buildScenarioRows(now: IncomeScenario, changed: IncomeScenario): ScenarioRow[] {
  return now.programs.map((p) => {
    const after = changed.programs.find((c) => c.programId === p.programId);
    return {
      programId: p.programId,
      nowOutcome: p.outcome,
      // A program missing from the changed run is treated as unknown, never as a loss.
      changedOutcome: after?.outcome ?? 'unknown',
      ...(p.estimatedBenefitCents !== undefined
        ? { nowBenefitCents: p.estimatedBenefitCents }
        : {}),
      ...(after?.estimatedBenefitCents !== undefined
        ? { changedBenefitCents: after.estimatedBenefitCents }
        : {}),
    };
  });
}

export type Direction = 'more' | 'less';

/** Signed monthly change in cents from a direction and a non-negative amount. */
export function signedDelta(direction: Direction, amountCents: number): number {
  const amount = Math.max(0, Math.round(amountCents));
  return direction === 'less' ? -amount : amount;
}

/** One plain-language sentence about where a program (or a person's coverage) may change. */
export function describeCliff(
  i18n: I18n,
  cliff: IncomeCliff,
  profile: Pick<HouseholdProfile, 'members'>,
  asOf: string,
): string {
  const program = i18n.t(`programs.${cliff.programId}`);
  const subject = cliff.memberId
    ? i18n.t('whatif.subjectPerson', {
        program,
        person: memberLabel(i18n, profile, cliff.memberId, asOf),
      })
    : program;
  const money = (cents: number): string => formatWholeDollars(i18n.language, cents);
  const { uncertainAtDeltaCents: change, lostAtDeltaCents: stop } = cliff;

  if (change !== undefined && stop !== undefined && change < stop) {
    return i18n.t('whatif.cliffChangeStop', { subject, change: money(change), stop: money(stop) });
  }
  if (stop !== undefined) return i18n.t('whatif.cliffStop', { subject, stop: money(stop) });
  if (change !== undefined) return i18n.t('whatif.cliffChange', { subject, change: money(change) });
  return i18n.t('whatif.cliffNone', { subject });
}
