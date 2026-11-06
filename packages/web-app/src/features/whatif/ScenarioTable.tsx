import { useTranslation } from 'react-i18next';
import { formatWholeDollars } from '../results/calcFormat.js';
import type { ScenarioRow } from './whatIfSummary.js';

function OutcomeCell({ outcome, benefitCents }: { outcome: string; benefitCents?: number }) {
  const { t, i18n } = useTranslation();
  return (
    <td>
      <span className={`outcome-${outcome}`}>{t(`outcome.${outcome}`)}</span>
      {benefitCents !== undefined && (
        <>
          <br />
          {t('whatif.benefit', { amount: formatWholeDollars(i18n.language, benefitCents) })}
        </>
      )}
    </td>
  );
}

/** Now vs. with-the-change table for every program. */
export function ScenarioTable({ rows }: { rows: ScenarioRow[] }) {
  const { t } = useTranslation();
  return (
    <div className="table-scroll">
      <table>
        <caption>{t('whatif.tableCaption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('whatif.colProgram')}</th>
            <th scope="col">{t('whatif.colNow')}</th>
            <th scope="col">{t('whatif.colChanged')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.programId}>
              <th scope="row">{t(`programs.${r.programId}`)}</th>
              <OutcomeCell outcome={r.nowOutcome} benefitCents={r.nowBenefitCents} />
              <OutcomeCell outcome={r.changedOutcome} benefitCents={r.changedBenefitCents} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
