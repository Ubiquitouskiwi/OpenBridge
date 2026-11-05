import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { EligibilityOutcome, ProgramEligibilityResult } from '@openbridge/shared';
import { useResultStore } from '../../store/result.js';
import { renderReason } from '../../i18n/renderReason.js';
import { SaveProgress } from '../save/SaveProgress.js';
import { DownloadForms } from '../forms/DownloadForms.js';

const POSITIVE: EligibilityOutcome[] = ['eligible', 'likely_eligible', 'possibly_eligible'];

export function ResultsView() {
  const { t, i18n } = useTranslation();
  const result = useResultStore((s) => s.result);

  if (!result) {
    return (
      <section>
        <h1>{t('results')}</h1>
        <p>No results yet.</p>
        <Link to="/screen">Start a screening</Link>
      </section>
    );
  }

  const anyPositive = result.results.some((r) => POSITIVE.includes(r.outcome));

  return (
    <section>
      <h1>{t('results')}</h1>
      <p>{t('results_intro')}</p>

      {!anyPositive && (
        <div className="program-card" role="note">
          <p>{t('no_match')}</p>
          <p>{t('no_match_help')}</p>
          <Link to="/help">{t('getHelp')}</Link>
        </div>
      )}

      {result.results.map((r) => (
        <ProgramCard key={r.programId} result={r} />
      ))}

      <DownloadForms />
      <SaveProgress />

      <div className="results-actions" style={{ marginTop: '1rem' }}>
        <Link to="/help">{t('getHelp')}</Link>
      </div>
    </section>
  );

  function ProgramCard({ result: r }: { result: ProgramEligibilityResult }) {
    return (
      <article className="program-card">
        <h2>
          <Link to={`/program/${r.programId}`}>{t(`programs.${r.programId}`)}</Link>
        </h2>
        <p className={`outcome-${r.outcome}`}>{t(`outcome.${r.outcome}`)}</p>
        <ul className="reason-list">
          {r.reasons.map((reason, idx) => (
            <li key={idx}>{renderReason(i18n, reason)}</li>
          ))}
        </ul>
        {r.scope === 'per_member' && r.memberResults && (
          <ul className="reason-list">
            {r.memberResults.map((m) => (
              <li key={m.memberId}>
                <span className={`outcome-${m.outcome}`}>{t(`outcome.${m.outcome}`)}</span> —{' '}
                {m.reasons.map((reason) => renderReason(i18n, reason)).join(' ')}
              </li>
            ))}
          </ul>
        )}
      </article>
    );
  }
}
