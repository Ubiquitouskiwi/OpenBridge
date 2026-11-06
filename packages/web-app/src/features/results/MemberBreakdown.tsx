import { useTranslation } from 'react-i18next';
import type { EligibilityResult, ProgramEligibilityResult, StateAdapter } from '@openbridge/shared';
import { renderReason } from '../../i18n/renderReason.js';
import { federal } from '../../data/index.js';
import { CalculationSteps } from './CalculationSteps.js';
import { memberLabel } from './memberLabel.js';

interface MemberBreakdownProps {
  program: ProgramEligibilityResult;
  result: EligibilityResult;
  adapter: StateAdapter | undefined;
}

/** Per-person results for per-member programs (Medicaid/CHIP, WIC), each with its math. */
export function MemberBreakdown({ program, result, adapter }: MemberBreakdownProps) {
  const { t, i18n } = useTranslation();
  const members = program.memberResults ?? [];
  if (members.length === 0) return null;

  return (
    <>
      <h2>{t('people.heading')}</h2>
      {members.map((m) => {
        const person = memberLabel(i18n, result.profile, m.memberId, result.evaluationDate);
        return (
          <article key={m.memberId} className="program-card">
            <h3>{person}</h3>
            <p className={`outcome-${m.outcome}`}>{t(`outcome.${m.outcome}`)}</p>
            <ul className="reason-list">
              {m.reasons.map((reason, idx) => (
                <li key={idx}>{renderReason(i18n, reason)}</li>
              ))}
            </ul>
            <CalculationSteps
              steps={m.calculation}
              adapter={adapter}
              federal={federal}
              summary={t('showMath.memberSummary', { person })}
            />
          </article>
        );
      })}
    </>
  );
}
